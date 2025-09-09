import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface UserEvent {
  id: string
  unique_url: string
  name: string
  date: string | null
  participant_count: number
  total_amount: number
  created_at: string
}

interface RecentEventsProps {
  events: UserEvent[]
}

export const RecentEvents = React.memo(({ events }: RecentEventsProps) => {
  return (
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
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">まだイベントがありません</p>
            <Link href="/events/new">
              <Button className="mt-4">最初のイベントを作成</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
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
                      {event.date && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {format(new Date(event.date), 'yyyy年MM月dd日', { locale: ja })}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="secondary">
                          <Users className="h-3 w-3 mr-1" />
                          {event.participant_count}人
                        </Badge>
                        <Badge variant="outline">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          ¥{event.total_amount.toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

RecentEvents.displayName = 'RecentEvents'