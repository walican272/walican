'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, Mail, Lock, User, UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Supabaseでユーザー登録
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      // 登録成功
      router.push('/auth/verify-email')
    } catch (error: any) {
      setError(error.message || '登録に失敗しました')
    } finally {
      setIsLoading(false)
    }
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
          <CardTitle>新規登録</CardTitle>
          <CardDescription>
            アカウントを作成して、すべての機能を利用しましょう
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                <User className="mr-2 inline h-4 w-4" />
                お名前
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="田中太郎"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

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
                placeholder="6文字以上"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                <Lock className="mr-2 inline h-4 w-4" />
                パスワード（確認）
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="もう一度入力"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              <UserPlus className="mr-2 h-4 w-4" />
              {isLoading ? '登録中...' : 'アカウント作成'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              すでにアカウントをお持ちの方は
            </p>
            <Link href="/auth/login" className="text-primary hover:underline">
              ログイン
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 max-w-md text-center text-xs text-muted-foreground">
        <p>
          登録することで、
          <Link href="/terms" className="underline">利用規約</Link>
          と
          <Link href="/privacy" className="underline">プライバシーポリシー</Link>
          に同意したものとみなされます。
        </p>
      </div>
    </main>
  )
}