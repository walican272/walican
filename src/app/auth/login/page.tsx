'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Wallet, Mail, Lock, LogIn, Github, Chrome } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) throw error

      // ログイン成功後、ダッシュボードへ
      router.push('/dashboard')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ログインに失敗しました')
      setIsLoading(false)
    }
  }

  const handleGuestLogin = () => {
    // ゲストモードで続行（認証なし）
    localStorage.setItem('guestMode', 'true')
    router.push('/')
  }

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <Wallet className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Walican</h1>
        <p className="mt-2 text-muted-foreground">かんたん割り勘管理</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
          <CardDescription>
            アカウントにログインして、すべての機能を利用しましょう
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="mr-2 inline h-4 w-4" />
                メールアドレス
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                <Lock className="mr-2 inline h-4 w-4" />
                パスワード
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              <LogIn className="mr-2 h-4 w-4" />
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                または
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Googleでログイン
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleSocialLogin('github')}
              disabled={isLoading}
            >
              <Github className="mr-2 h-4 w-4" />
              GitHubでログイン
            </Button>
          </div>

          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              アカウントをお持ちでない方は
            </p>
            <Link href="/auth/register" className="text-primary hover:underline">
              新規登録
            </Link>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ログインせずに利用
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleGuestLogin}
          >
            ゲストとして続行
            <Badge variant="outline" className="ml-2">
              機能制限あり
            </Badge>
          </Button>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>ログインすることで以下の機能が利用できます：</p>
        <ul className="mt-2 space-y-1">
          <li>✓ 複数イベントの管理</li>
          <li>✓ グループ機能</li>
          <li>✓ データのクラウド同期</li>
          <li>✓ 履歴の永続保存</li>
        </ul>
      </div>
    </main>
  )
}