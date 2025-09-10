import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

export interface UserProfile {
  id: string
  email?: string
  display_name?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

/**
 * ユーザープロファイルを取得
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()
  
  try {
    // 現在のユーザー情報から取得を試みる
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (currentUser && currentUser.id === userId) {
      return {
        id: currentUser.id,
        email: currentUser.email,
        display_name: currentUser.user_metadata?.display_name || 
                     currentUser.user_metadata?.full_name ||
                     currentUser.user_metadata?.name ||
                     currentUser.email?.split('@')[0] || 
                     '名無しさん',
        avatar_url: currentUser.user_metadata?.avatar_url,
        created_at: currentUser.created_at,
      }
    }
    
    return null
  } catch (error) {
    logger.error('Error fetching user profile:', error)
    return null
  }
}

/**
 * 現在のユーザーの表示名を取得
 */
export async function getCurrentUserDisplayName(): Promise<string> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return '名無しさん'
    
    // メタデータから取得
    const displayName = 
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      '名無しさん'
    
    return displayName
  } catch (error) {
    logger.error('Error getting display name:', error)
    return '名無しさん'
  }
}