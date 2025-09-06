'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowRight, Wallet, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()
  const [existingUrl, setExistingUrl] = useState('')

  const handleCreateEvent = () => {
    router.push('/events/new')
  }

  const handleJoinEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (existingUrl) {
      const url = existingUrl.replace(/^https?:\/\/[^\/]+\/events\//, '')
      router.push(`/events/${url}`)
    }
  }

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      {/* Navigation */}
      <div className="absolute top-0 left-0 right-0 p-4">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-semibold">Walican</span>
          </div>
          {!user && (
            <div className="flex gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  ログイン
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  新規登録
                </Button>
              </Link>
            </div>
          )}
          {user && (
            <Link href="/dashboard">
              <Button size="sm">
                ダッシュボード
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <Wallet className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Walican</h1>
        <p className="mt-2 text-muted-foreground">かんたん割り勘管理</p>
        {user && (
          <Badge variant="secondary" className="mt-2">
            {user.email} でログイン中
          </Badge>
        )}
      </div>

      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>新しいイベントを作成</CardTitle>
            <CardDescription>
              旅行や飲み会など、新しい割り勘イベントを始めましょう
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreateEvent} className="w-full" size="lg">
              <Plus className="mr-2 h-5 w-5" />
              イベントを作成
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>既存のイベントに参加</CardTitle>
            <CardDescription>共有されたURLまたはコードを入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-url">イベントURL / コード</Label>
                <Input
                  id="event-url"
                  type="text"
                  placeholder="URLまたはイベントコードを入力"
                  value={existingUrl}
                  onChange={(e) => setExistingUrl(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" variant="outline" disabled={!existingUrl}>
                <ArrowRight className="mr-2 h-5 w-5" />
                イベントに参加
              </Button>
            </form>
          </CardContent>
        </Card>

        {!user && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">もっと便利に使う</CardTitle>
              <CardDescription>
                アカウントを作成すると、複数のイベントを管理したり、
                履歴を永続的に保存できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/auth/register" className="block">
                <Button variant="outline" className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  無料でアカウント作成
                </Button>
              </Link>
              <p className="text-center text-xs text-muted-foreground">
                すでにアカウントをお持ちの方は
                <Link href="/auth/login" className="text-primary hover:underline ml-1">
                  ログイン
                </Link>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}