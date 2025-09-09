'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowRight, Wallet, LogIn, UserPlus, Zap, ChevronDown } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { TrustIndicators, MobileTrustBadge } from '@/components/landing/trust-indicators'

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()
  const [existingUrl, setExistingUrl] = useState('')

  const handleQuickStart = () => {
    router.push('/quick')
  }
  
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
    <main className="min-h-screen">
      {/* Navigation */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-semibold">Walican</span>
          </div>
          <div className="flex gap-2">
            {user ? (
              <Link href="/dashboard">
                <Button size="sm">
                  ダッシュボード
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">ログイン</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section - 改善版 */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center px-4 py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="relative z-10 max-w-3xl text-center space-y-8">
          {/* アイコンとタイトル */}
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Wallet className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              割り勘を、<br className="sm:hidden" />
              <span className="text-primary">もっとシンプルに</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
              面倒な計算は不要。URLを共有するだけで、<br className="hidden sm:inline" />
              みんなで簡単に割り勘管理
            </p>
          </div>

          {/* メインCTA - シンプルな1ボタン */}
          <div className="space-y-4">
            <Button 
              onClick={handleQuickStart} 
              size="lg" 
              className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all animate-pulse hover:animate-none"
            >
              <Zap className="mr-2 h-5 w-5" />
              今すぐ割り勘を始める
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <div className="text-sm text-muted-foreground">
              60秒で作成完了・登録不要・無料
            </div>
          </div>

          {/* 信頼性表示（モバイル版） */}
          <div className="sm:hidden">
            <MobileTrustBadge />
          </div>

          {/* 信頼性表示（デスクトップ版） */}
          <div className="hidden sm:block">
            <TrustIndicators variant="inline" maxItems={3} />
          </div>
        </div>

        {/* スクロールインジケーター */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-muted-foreground" />
        </div>
      </section>

      {/* 既存ユーザー向けセクション */}
      <section className="container mx-auto px-4 py-12 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">URLをお持ちの方</h2>
          <p className="text-muted-foreground">
            共有されたURLから既存のイベントに参加
          </p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-lg">イベントに参加</CardTitle>
            <CardDescription>URLまたはイベントコードを入力</CardDescription>
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
      </section>
    </main>
  )
}