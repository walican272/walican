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
import { ArrowLeft, ArrowRight, CheckCircle, Calculator } from 'lucide-react'
import { calculateBalances, calculateSettlements } from '@/lib/utils/settlement'
import type { Event, Participant, Expense } from '@/types'

export default function SettlementsPage() {
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
      // イベント情報を取得
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('unique_url', eventUrl)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      // 参加者と支払いを取得
      const [participantsData, expensesData] = await Promise.all([
        participantApi.getByEventId(eventData.id),
        expenseApi.getByEventId(eventData.id)
      ])

      setParticipants(participantsData)
      setExpenses(expensesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const balances = calculateBalances(participants, expenses)
  const settlements = calculateSettlements(balances)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Calculator className="mx-auto h-12 w-12 animate-pulse text-primary" />
          <p className="mt-2 text-muted-foreground">精算を計算中...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header 
        title="精算"
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
          {/* サマリー */}
          <Card>
            <CardHeader>
              <CardTitle>精算サマリー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">合計金額</span>
                  <span className="text-xl font-bold">¥{totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">参加人数</span>
                  <span>{participants.length}人</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">1人あたり</span>
                  <span className="font-semibold">
                    ¥{participants.length > 0 ? Math.round(totalExpenses / participants.length).toLocaleString() : 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 個人別収支 */}
          <Card>
            <CardHeader>
              <CardTitle>個人別収支</CardTitle>
              <CardDescription>各参加者の支払い状況</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {balances.map(({ participant, paid, shouldPay, balance }) => (
                  <div key={participant.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{participant.name}</p>
                        <p className="text-sm text-muted-foreground">
                          支払い: ¥{paid.toLocaleString()} / 負担: ¥{Math.round(shouldPay).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          balance > 0 ? 'text-green-600' : 
                          balance < 0 ? 'text-red-600' : 
                          'text-gray-500'
                        }`}>
                          {balance > 0 ? '+' : ''}{Math.round(balance).toLocaleString()}円
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {balance > 0 ? '受け取る' : balance < 0 ? '支払う' : '精算済み'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 精算フロー */}
          <Card>
            <CardHeader>
              <CardTitle>精算フロー</CardTitle>
              <CardDescription>誰が誰にいくら払うか</CardDescription>
            </CardHeader>
            <CardContent>
              {settlements.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <p className="mt-2 text-muted-foreground">精算の必要はありません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {settlements.map((settlement, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-lg bg-muted p-4">
                      <div className="flex-1">
                        <p className="font-medium">{settlement.from.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        <div className="rounded-md bg-primary px-3 py-1 text-primary-foreground">
                          <span className="font-bold">¥{settlement.amount.toLocaleString()}</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-medium">{settlement.to.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 精算完了ボタン */}
          {settlements.length > 0 && (
            <Button className="w-full" size="lg">
              <CheckCircle className="mr-2 h-5 w-5" />
              精算を完了する
            </Button>
          )}
        </div>
      </main>

      <BottomNav eventUrl={eventUrl} />
    </>
  )
}