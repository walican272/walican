'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Users, Plus, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface EventWithStats {
  id: string
  unique_url: string
  name: string
  date: string | null
  location: string | null
  description: string | null
  participant_count: number
  total_amount: number
  created_at: string
}

export default function EventsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setIsLoading(true)
    try {
      // すべてのイベントを取得
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

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
            ...event,
            participant_count: participantCount || 0,
            total_amount: totalAmount
          }
        })
      )

      setEvents(formattedEvents)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Calendar className="mx-auto h-12 w-12 animate-pulse text-primary" />
          <p className="mt-2 text-muted-foreground">イベントを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header 
        title="イベント一覧"
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
            <h2 className="text-2xl font-bold">すべてのイベント</h2>
            <p className="text-muted-foreground">{events.length}件のイベント</p>
          </div>
          <Link href="/events/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </Link>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">イベントがありません</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  最初のイベントを作成してみましょう
                </p>
                <Link href="/events/new">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    イベントを作成
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.unique_url}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{event.name}</CardTitle>
                    {event.description && (
                      <CardDescription className="line-clamp-2">
                        {event.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {event.date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(event.date), 'yyyy年MM月dd日', { locale: ja })}
                          </span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{event.participant_count}人参加</span>
                      </div>
                      {event.total_amount > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-base font-semibold text-foreground">
                            合計: ¥{event.total_amount.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}