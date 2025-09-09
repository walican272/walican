import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Users, TrendingUp } from 'lucide-react'

interface StatsCardsProps {
  totalEvents: number
  totalParticipants: number
  totalAmount: number
  totalGroups: number
}

export const StatsCards = React.memo(({ 
  totalEvents, 
  totalParticipants, 
  totalAmount, 
  totalGroups 
}: StatsCardsProps) => {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">総イベント数</p>
              <p className="text-2xl font-bold">{totalEvents}</p>
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
              <p className="text-2xl font-bold">{totalGroups}</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

StatsCards.displayName = 'StatsCards'