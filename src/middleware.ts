import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logger } from '@/lib/utils/logger'

// セッションの有効期限（ミリ秒）
const SESSION_DURATION = 60 * 60 * 1000 // 1時間
const SESSION_REFRESH_THRESHOLD = 15 * 60 * 1000 // 15分

export async function middleware(request: NextRequest) {
  const supabase = await createClient()
  const { pathname } = request.nextUrl
  
  try {
    // セッション情報を取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      logger.error('Session error:', sessionError)
      // セッションエラーの場合、クッキーをクリアしてリダイレクト
      const response = NextResponse.redirect(new URL('/auth/login', request.url))
      response.cookies.delete('sb-auth-token')
      return response
    }
    
    // セッションが存在する場合、有効期限をチェック
    if (session) {
      const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null
      const now = new Date()
      
      if (expiresAt) {
        const timeUntilExpiry = expiresAt.getTime() - now.getTime()
        
        // セッションが期限切れの場合
        if (timeUntilExpiry <= 0) {
          logger.info('Session expired, redirecting to login')
          const response = NextResponse.redirect(new URL('/auth/login', request.url))
          response.cookies.delete('sb-auth-token')
          return response
        }
        
        // セッションの有効期限が15分以内の場合、リフレッシュを試みる
        if (timeUntilExpiry <= SESSION_REFRESH_THRESHOLD) {
          logger.info('Refreshing session...')
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshError) {
            logger.error('Failed to refresh session:', refreshError)
            // リフレッシュに失敗した場合、ユーザーに再ログインを促す
            const response = NextResponse.redirect(new URL('/auth/login', request.url))
            response.cookies.delete('sb-auth-token')
            return response
          }
          
          if (refreshData.session) {
            logger.info('Session refreshed successfully')
            // 新しいセッショントークンをクッキーに設定
            const response = NextResponse.next()
            response.cookies.set('sb-auth-token', refreshData.session.access_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: SESSION_DURATION / 1000, // 秒単位
            })
            return response
          }
        }
      }
    }
    
    // ユーザー情報を取得（セッションがある場合）
    const { data: { user } } = await supabase.auth.getUser()
    
    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/settings', '/profile']
    const authRoutes = ['/auth/login', '/auth/register']
    
    // Check if current route is protected
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
    
    // Redirect unauthenticated users trying to access protected routes
    if (isProtectedRoute && !user) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Redirect authenticated users away from auth routes
    if (isAuthRoute && user) {
      const redirect = request.nextUrl.searchParams.get('redirect')
      const redirectUrl = redirect || '/dashboard'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    
    // セッション情報をヘッダーに追加（クライアント側で利用可能）
    const response = NextResponse.next()
    if (session && session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000)
      const timeUntilExpiry = expiresAt.getTime() - new Date().getTime()
      response.headers.set('X-Session-Expires-In', timeUntilExpiry.toString())
    }
    
    return response
    
  } catch (error) {
    logger.error('Middleware error:', error)
    // エラーが発生した場合は通常のフローを続行
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}