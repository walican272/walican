'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Users, 
  Calendar,
  TrendingUp,
  LogOut,
  Settings,
  Wallet,
  Clock,
  ArrowRight
} from 'lucide-react'

interface UserEvent {
  id: string
  unique_url: string
  name: string
  date: string | null
  participant_count: number
  total_amount: number
  created_at: string
}

interface UserGroup {
  id: string
  name: string
  member_count: number
  event_count: number
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<UserEvent[]>([])
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    loadDashboardData()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
  }

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // ユーザーが作成したイベントを取得
      const { data: eventsData } = await supabase
        .from('events')
        .select(`
          id,
          unique_url,
          name,
          date,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // 各イベントの参加者数と支出総額を取得
      const formattedEvents = await Promise.all(
        (eventsData || []).map(async (event) => {
          // 参加者数を取得
          const { count: participantCount } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)

          // 支出総額を取得
          const { data: expenses } = await supabase
            .from('expenses')
            .select('amount')
            .eq('event_id', event.id)

          const totalAmount = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0

          return {
            id: event.id,
            unique_url: event.unique_url,
            name: event.name,
            date: event.date,
            participant_count: participantCount || 0,
            total_amount: totalAmount,
            created_at: event.created_at
          }
        })
      )

      setEvents(formattedEvents)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const totalAmount = events.reduce((sum, event) => sum + event.total_amount, 0)
  const totalParticipants = events.reduce((sum, event) => sum + event.participant_count, 0)

  return (
    <>
      <Header 
        title={
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <span>ダッシュボード</span>
          </div>
        }
        action={
          <div className="flex gap-2">
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        }
      />

      <main className="container mx-auto p-4 pb-20">
        {user && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              こんにちは、{user.user_metadata?.name || user.email}さん
            </h2>
            <p className="text-muted-foreground">
              あなたの割り勘イベントを管理しましょう
            </p>
          </div>
        )}

        {/* 統計サマリー */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">総イベント数</p>
                  <p className="text-2xl font-bold">{events.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">総参加者数</p>
                  <p className="text-2xl font-bold">{totalParticipants}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">総支出額</p>
                  <p className="text-lg font-bold">¥{totalAmount.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">グループ数</p>
                  <p className="text-2xl font-bold">{groups.length}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* アクションボタン */}
        <div className="mb-6 flex gap-2">
          <Link href="/events/new" className="flex-1">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              新しいイベント
            </Button>
          </Link>
          <Link href="/groups/new" className="flex-1">
            <Button variant="outline" className="w-full">
              <Users className="mr-2 h-4 w-4" />
              グループ作成
            </Button>
          </Link>
        </div>

        {/* 最近のイベント */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>最近のイベント</CardTitle>
              <CardDescription>
                最近作成または更新されたイベント
              </CardDescription>
            </div>
            <Link href="/events">
              <Button variant="ghost" size="sm">
                すべて見る
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-4">読み込み中...</p>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">まだイベントがありません</p>
                <Link href="/events/new">
                  <Button variant="outline" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    最初のイベントを作成
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <Link 
                    key={event.id} 
                    href={`/events/${event.unique_url}`}
                    className="block"
                  >
                    <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{event.name}</h4>
                          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {event.participant_count}人
                            </span>
                            <span>¥{event.total_amount.toLocaleString()}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(event.created_at).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          アクティブ
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* グループ一覧（将来実装） */}
        {groups.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>マイグループ</CardTitle>
                <CardDescription>
                  参加しているグループ
                </CardDescription>
              </div>
              <Link href="/groups">
                <Button variant="ghost" size="sm">
                  すべて見る
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{group.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {group.member_count}人のメンバー • {group.event_count}個のイベント
                        </p>
                      </div>
                      <Badge>アクティブ</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  )
}