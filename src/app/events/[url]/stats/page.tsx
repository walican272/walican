'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { participantApi } from '@/lib/supabase/api/participants'
import { expenseApi } from '@/lib/supabase/api/expenses'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, TrendingUp, PieChart, BarChart3, Users } from 'lucide-react'
import {
  BarChart, Bar, PieChart as RePieChart, Pie, Cell, 
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, Area, AreaChart
} from 'recharts'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Event, Participant, Expense } from '@/types'
import { logger } from '@/lib/utils/logger'

export default function StatsPage() {
  const params = useParams()
  const eventUrl = params.url as string
  const supabase = createClient()
  
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (eventUrl) {
      loadEventData()
    }
  }, [eventUrl])

  const loadEventData = async () => {
    setIsLoading(true)
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('unique_url', eventUrl)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      const [participantsData, expensesData] = await Promise.all([
        participantApi.getByEventId(eventData.id),
        expenseApi.getByEventId(eventData.id)
      ])

      setParticipants(participantsData)
      setExpenses(expensesData)
    } catch (error) {
      logger.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // データ集計
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  
  // カテゴリ別集計
  const categoryData = Object.entries(
    expenses.reduce((acc, expense) => {
      const category = expense.category || 'other'
      acc[category] = (acc[category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)
  ).map(([category, amount]) => {
    const categoryInfo = {
      food: { label: '食事', color: '#FF6B6B' },
      transport: { label: '交通費', color: '#4ECDC4' },
      accommodation: { label: '宿泊', color: '#45B7D1' },
      entertainment: { label: 'エンタメ', color: '#96CEB4' },
      shopping: { label: '買い物', color: '#FFEAA7' },
      other: { label: 'その他', color: '#74B9FF' },
    }[category] || { label: 'その他', color: '#74B9FF' }
    
    return {
      name: categoryInfo.label,
      value: amount,
      color: categoryInfo.color,
      percentage: ((amount / totalExpenses) * 100).toFixed(1)
    }
  })

  // 参加者別支払い額
  const participantPaymentData = participants.map(participant => {
    const paid = expenses
      .filter(e => e.paid_by === participant.id)
      .reduce((sum, e) => sum + e.amount, 0)
    
    return {
      name: participant.name,
      paid,
      shouldPay: totalExpenses / participants.length,
      balance: paid - (totalExpenses / participants.length)
    }
  })

  // 日別支出推移
  const dailyExpenses = expenses.reduce((acc, expense) => {
    const date = format(parseISO(expense.created_at), 'MM/dd', { locale: ja })
    acc[date] = (acc[date] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const timelineData = Object.entries(dailyExpenses)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // 累積支出
  let cumulative = 0
  const cumulativeData = timelineData.map(item => {
    cumulative += item.amount
    return {
      date: item.date,
      daily: item.amount,
      cumulative
    }
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <>
      <Header 
        title="統計・分析"
        action={
          <Link href={`/events/${eventUrl}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        }
      />

      <main className="container mx-auto p-4 pb-20">
        <div className="space-y-4">
          {/* サマリーカード */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  ¥{totalExpenses.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">合計支出</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {participants.length}
                </div>
                <p className="text-xs text-muted-foreground">参加人数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {expenses.length}
                </div>
                <p className="text-xs text-muted-foreground">支払い回数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  ¥{participants.length > 0 ? Math.round(totalExpenses / participants.length).toLocaleString() : 0}
                </div>
                <p className="text-xs text-muted-foreground">1人あたり</p>
              </CardContent>
            </Card>
          </div>

          {/* カテゴリ別円グラフ */}
          {categoryData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  カテゴリ別支出
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} ${entry.percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {categoryData.map((category) => (
                    <div key={category.name} className="flex items-center gap-2 text-sm">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                      <span className="ml-auto font-semibold">
                        ¥{category.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 参加者別支払い額 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                参加者別支払い額
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={participantPaymentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="paid" fill="#8884d8" name="支払い額" />
                  <Bar dataKey="shouldPay" fill="#82ca9d" name="負担額" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 支出推移 */}
          {cumulativeData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  支出推移
                </CardTitle>
                <CardDescription>日別支出と累積額</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={cumulativeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                      name="累積額"
                    />
                    <Bar dataKey="daily" fill="#82ca9d" name="日別支出" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* 統計サマリー */}
          <Card>
            <CardHeader>
              <CardTitle>統計サマリー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">平均支払い額</span>
                  <span className="font-semibold">
                    ¥{expenses.length > 0 ? Math.round(totalExpenses / expenses.length).toLocaleString() : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最大支払い額</span>
                  <span className="font-semibold">
                    ¥{expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)).toLocaleString() : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最小支払い額</span>
                  <span className="font-semibold">
                    ¥{expenses.length > 0 ? Math.min(...expenses.map(e => e.amount)).toLocaleString() : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最も使ったカテゴリ</span>
                  <span className="font-semibold">
                    {categoryData.length > 0 ? categoryData.sort((a, b) => b.value - a.value)[0].name : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav eventUrl={eventUrl} />
    </>
  )
}