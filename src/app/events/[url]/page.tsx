'use client'

import { useEffect, useState, useCallback, useMemo, useReducer } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ExpenseEditModal } from '@/components/expense-edit-modal'
import { ExpenseCreateModal } from '@/components/expense/expense-create-modal'
import { ParticipantsList } from '@/components/participants/participants-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Copy, 
  Check,
  Wallet,
  BarChart3,
  Edit2,
  Settings,
  Users,
  Plus
} from 'lucide-react'
import type { Event, Participant, Expense, EXPENSE_CATEGORIES } from '@/types'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { formatCurrency } from '@/lib/utils/currency'

// イベントデータの状態を管理するReducer
type EventDataState = {
  event: Event | null
  participants: Participant[]
  expenses: Expense[]
  isLoading: boolean
}

type EventDataAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ALL_DATA'; payload: { event: Event; participants: Participant[]; expenses: Expense[] } }
  | { type: 'SET_EVENT'; payload: Event }
  | { type: 'SET_PARTICIPANTS'; payload: Participant[] }
  | { type: 'SET_EXPENSES'; payload: Expense[] }

function eventDataReducer(state: EventDataState, action: EventDataAction): EventDataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ALL_DATA':
      return { 
        ...state, 
        event: action.payload.event,
        participants: action.payload.participants,
        expenses: action.payload.expenses,
        isLoading: false
      }
    case 'SET_EVENT':
      return { ...state, event: action.payload }
    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.payload }
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload }
    default:
      return state
  }
}

export default function EventDetailPage() {
  const params = useParams()
  const eventUrl = params.url as string
  const supabase = createClient()
  const { handleError } = useErrorHandler()
  
  // バッチ処理のためにReducerを使用
  const [eventData, dispatch] = useReducer(eventDataReducer, {
    event: null,
    participants: [],
    expenses: [],
    isLoading: true
  })
  
  const { event, participants, expenses, isLoading } = eventData
  
  const [isCopied, setIsCopied] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isExpenseEditModalOpen, setIsExpenseEditModalOpen] = useState(false)
  const [isExpenseCreateModalOpen, setIsExpenseCreateModalOpen] = useState(false)

  const loadEventData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      // イベント情報を取得
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('unique_url', eventUrl)
        .single()

      if (eventError) throw eventError

      // 並列でデータを取得
      const [participantsResult, expensesResult] = await Promise.all([
        supabase
          .from('participants')
          .select('*')
          .eq('event_id', eventData.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('expenses')
          .select('*')
          .eq('event_id', eventData.id)
          .order('created_at', { ascending: false })
      ])

      if (participantsResult.error) throw participantsResult.error
      if (expensesResult.error) throw expensesResult.error

      // 一度にすべてのデータを更新（バッチ処理）
      dispatch({
        type: 'SET_ALL_DATA',
        payload: {
          event: eventData,
          participants: participantsResult.data || [],
          expenses: expensesResult.data || []
        }
      })
    } catch (error) {
      handleError(error, 'イベントデータの読み込みに失敗しました')
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [eventUrl, supabase, handleError])

  useEffect(() => {
    if (eventUrl) {
      loadEventData()
    }
  }, [eventUrl, loadEventData])

  // リアルタイム更新の設定
  useRealtimeSubscription({
    eventId: event?.id || null,
    onUpdate: loadEventData,
  })


  const copyEventUrl = async () => {
    const url = `${window.location.origin}/events/${eventUrl}`
    try {
      await navigator.clipboard.writeText(url)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      handleError(error, 'URLのコピーに失敗しました')
    }
  }

  // パフォーマンス最適化: 高価な計算をメモ化
  const { totalExpenses, perPerson, balances } = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const perPerson = participants.length > 0 ? totalExpenses / participants.length : 0
    
    const balances = participants.map(participant => {
      const paid = expenses
        .filter(expense => expense.paid_by === participant.id)
        .reduce((sum, expense) => sum + expense.amount, 0)
      
      return {
        participant,
        paid,
        shouldPay: perPerson,
        balance: paid - perPerson
      }
    })
    
    return { totalExpenses, perPerson, balances }
  }, [expenses, participants])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Wallet className="mx-auto h-12 w-12 animate-pulse text-primary" />
          <p className="mt-2 text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>イベントが見つかりません</CardTitle>
            <CardDescription>URLを確認してもう一度お試しください</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // calculateBalance関数は削除済み、useMemoで直接計算

  return (
    <>
      <Header 
        title={
          <div className="flex items-center gap-2">
            <span>{event.name}</span>
            {participants.length > 0 && expenses.length > 0 && (
              <Badge variant="success" className="animate-pulse">
                リアルタイム
              </Badge>
            )}
          </div>
        }
        action={
          <div className="flex gap-2">
            <Link href={`/events/${eventUrl}/settings`}>
              <Button variant="outline" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={copyEventUrl}
              className="gap-2"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  コピー済み
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  URLコピー
                </>
              )}
            </Button>
          </div>
        }
      />

      <main className="container mx-auto p-4 pb-20">
        <div className="space-y-4">
          {/* 参加者リスト - 新しいコンポーネントに置き換え */}
          <ParticipantsList 
            eventId={event.id} 
            isQuickMode={event.is_quick_mode}
          />

          {/* 精算状況 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">精算状況</CardTitle>
              <div className="flex gap-2">
                <Link href={`/events/${eventUrl}/stats`}>
                  <Button size="sm" variant="outline">
                    <BarChart3 className="mr-1 h-4 w-4" />
                    統計
                  </Button>
                </Link>
                <Link href={`/events/${eventUrl}/settlements`}>
                  <Button size="sm" variant="outline">
                    詳細
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-center">
                <p className="text-2xl font-bold">
                  合計: {formatCurrency(totalExpenses, event?.currency || 'JPY')}
                </p>
                {participants.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    1人あたり: {formatCurrency(Math.round(totalExpenses / participants.length), event?.currency || 'JPY')}
                  </p>
                )}
              </div>
              
              {balances.length > 0 && (
                <div className="space-y-2">
                  {balances.map(({ participant, balance }) => (
                    <div key={participant.id} className="flex items-center justify-between text-sm">
                      <span>{participant.name}</span>
                      <span className={balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : ''}>
                        {balance > 0 ? '+' : ''}{Math.round(balance).toLocaleString()}円
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 支払い履歴 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">支払い履歴</CardTitle>
              <Button 
                size="sm"
                onClick={() => setIsExpenseCreateModalOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                追加
              </Button>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  まだ支払いがありません
                </p>
              ) : (
                <div className="space-y-2">
                  {expenses.map((expense) => {
                    const payer = participants.find(p => p.id === expense.paid_by)
                    const categoryInfo = {
                      food: { label: '食事', icon: '🍽️' },
                      transport: { label: '交通費', icon: '🚗' },
                      accommodation: { label: '宿泊', icon: '🏨' },
                      entertainment: { label: 'エンタメ', icon: '🎉' },
                      shopping: { label: '買い物', icon: '🛍️' },
                      other: { label: 'その他', icon: '📝' },
                    }[expense.category] || { label: 'その他', icon: '📝' }
                    
                    return (
                      <div key={expense.id} className="rounded-lg border p-3 last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                           onClick={() => {
                             setSelectedExpense(expense)
                             setIsExpenseEditModalOpen(true)
                           }}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{categoryInfo.icon}</span>
                              <p className="text-sm font-medium">
                                {expense.description || categoryInfo.label}
                              </p>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {payer?.name} が支払い
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(expense.created_at).toLocaleString('ja-JP')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-semibold">¥{expense.amount.toLocaleString()}</p>
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav eventUrl={eventUrl} />

      <ExpenseEditModal
        expense={selectedExpense}
        eventId={event?.id || ''}
        isOpen={isExpenseEditModalOpen}
        onClose={() => {
          setIsExpenseEditModalOpen(false)
          setSelectedExpense(null)
        }}
        onSuccess={() => loadEventData()}
      />

      <ExpenseCreateModal
        eventId={event?.id || ''}
        isOpen={isExpenseCreateModalOpen}
        onClose={() => setIsExpenseCreateModalOpen(false)}
        onSuccess={() => loadEventData()}
      />
    </>
  )
}