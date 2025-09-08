'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus, ArrowLeft, Calendar, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Group {
  id: string
  name: string
  description: string | null
  created_at: string
  member_count?: number
  event_count?: number
}

export default function GroupsPage() {
  const supabase = createClient()
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    setIsLoading(true)
    try {
      // グループ一覧を取得
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (groupsError) throw groupsError

      // 各グループのメンバー数とイベント数を取得
      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group) => {
          const [memberCount, eventCount] = await Promise.all([
            supabase
              .from('group_members')
              .select('id', { count: 'exact' })
              .eq('group_id', group.id),
            supabase
              .from('events')
              .select('id', { count: 'exact' })
              .eq('group_id', group.id)
          ])

          return {
            ...group,
            member_count: memberCount.count || 0,
            event_count: eventCount.count || 0
          }
        })
      )

      setGroups(groupsWithCounts)
    } catch (error) {
      console.error('Error loading groups:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 animate-pulse text-primary" />
          <p className="mt-2 text-muted-foreground">グループを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header 
        title="グループ"
        action={
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        }
      />

      <main className="container mx-auto p-4 pb-20">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">マイグループ</h2>
            <p className="text-muted-foreground">参加しているグループ一覧</p>
          </div>
          <Link href="/groups/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </Link>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">グループがありません</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  グループを作成して、メンバーとイベントを共有しましょう
                </p>
                <Link href="/groups/new">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    最初のグループを作成
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="line-clamp-1">{group.name}</CardTitle>
                      {group.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {group.description}
                        </CardDescription>
                      )}
                    </div>
                    <Link href={`/groups/${group.id}/settings`}>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{group.member_count}人</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{group.event_count}件</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Link href={`/groups/${group.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        詳細を見る
                      </Button>
                    </Link>
                    <Link href={`/events/new?group=${group.id}`} className="flex-1">
                      <Button className="w-full">
                        イベント作成
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  )
}