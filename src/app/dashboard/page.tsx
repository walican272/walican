'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/auth-provider'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { Header } from '@/components/layout/header'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { RecentEvents } from '@/components/dashboard/RecentEvents'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Users, 
  LogOut,
  Settings,
  Wallet,
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
  const { user, loading: authLoading, signOut: logout } = useAuth()
  const { handleError } = useErrorHandler()
  const [events, setEvents] = useState<UserEvent[]>([])
  const [groups] = useState<UserGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 最近のイベントを参加者数と支出情報と共に取得（JOINでN+1を回避）
      const { data: eventsData } = await supabase
        .from('events')
        .select(`
          id,
          unique_url,
          name,
          date,
          created_at,
          participants!inner (
            id
          ),
          expenses (
            amount
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      // データを整形（クライアントサイドで集計）
      const formattedEvents = (eventsData || []).map((event) => {
        const participantCount = event.participants?.length || 0
        const totalAmount = event.expenses?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0

        return {
          id: event.id,
          unique_url: event.unique_url,
          name: event.name,
          date: event.date,
          participant_count: participantCount,
          total_amount: totalAmount,
          created_at: event.created_at
        }
      })

      setEvents(formattedEvents)
    } catch (error) {
      handleError(error, 'ダッシュボードデータの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, handleError])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      loadDashboardData()
    }
  }, [user, authLoading, router, loadDashboardData])

  const totalAmount = useMemo(() => 
    events.reduce((sum, event) => sum + event.total_amount, 0),
    [events]
  )
  
  const totalParticipants = useMemo(() => 
    events.reduce((sum, event) => sum + event.participant_count, 0),
    [events]
  )

  const handleLogout = useCallback(async () => {
    await logout()
  }, [logout])

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

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

        <StatsCards 
          totalEvents={events.length}
          totalParticipants={totalParticipants}
          totalAmount={totalAmount}
          totalGroups={groups.length}
        />

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

        {isLoading ? (
          <Card>
            <CardContent className="p-8">
              <p className="text-center text-muted-foreground">データを読み込み中...</p>
            </CardContent>
          </Card>
        ) : (
          <RecentEvents events={events} />
        )}

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