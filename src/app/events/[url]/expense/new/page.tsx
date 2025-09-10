'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { expenseApi } from '@/lib/supabase/api/expenses'
import { participantApi } from '@/lib/supabase/api/participants'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Calculator, Users, Camera } from 'lucide-react'
import { OcrScanner } from '@/components/expense/ocr-scanner'
import Link from 'next/link'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import type { Event, Participant, ExpenseCategory, EXPENSE_CATEGORIES } from '@/types'

export default function NewExpensePage() {
  const params = useParams()
  const router = useRouter()
  const eventUrl = params.url as string
  const supabase = createClient()
  const { handleError } = useErrorHandler()
  
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    paidBy: '',
    amount: '',
    category: 'food' as ExpenseCategory,
    description: '',
  })
  
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal')
  const [customSplits, setCustomSplits] = useState<Record<string, number>>({})
  const [showOcrScanner, setShowOcrScanner] = useState(false)

  useEffect(() => {
    if (eventUrl) {
      loadEventData()
    }
  }, [eventUrl])

  const loadEventData = async () => {
    try {
      // イベント情報を取得
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('unique_url', eventUrl)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      // 参加者を取得
      const participantsData = await participantApi.getByEventId(eventData.id)
      setParticipants(participantsData)
      
      // デフォルトで均等割りの金額を設定
      if (participantsData.length > 0) {
        const splits: Record<string, number> = {}
        participantsData.forEach(p => {
          splits[p.id] = 0
        })
        setCustomSplits(splits)
      }
    } catch (error) {
      handleError(error, 'イベントデータの読み込みに失敗しました')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.paidBy || !formData.amount || !event) return

    setIsLoading(true)

    try {
      const amount = parseFloat(formData.amount)
      
      // 分割情報を作成
      let splits
      if (splitType === 'equal') {
        splits = expenseApi.createEqualSplits(amount, participants.map(p => p.id))
      } else {
        splits = Object.entries(customSplits)
          .filter(([_, amount]) => amount > 0)
          .map(([participantId, amount]) => ({
            expense_id: '',
            participant_id: participantId,
            amount,
            is_settled: false,
          }))
      }

      // 支払いを作成
      await expenseApi.create(
        {
          event_id: event.id,
          paid_by: formData.paidBy,
          amount,
          currency: 'JPY',
          category: formData.category,
          description: formData.description || undefined,
        },
        splits
      )

      router.push(`/events/${eventUrl}`)
    } catch (error) {
      handleError(error, '支払いの追加に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const updateCustomSplit = (participantId: string, value: string) => {
    const amount = parseFloat(value) || 0
    setCustomSplits(prev => ({
      ...prev,
      [participantId]: amount
    }))
  }

  const getTotalSplit = () => {
    return Object.values(customSplits).reduce((sum, amount) => sum + amount, 0)
  }

  const categories = [
    { value: 'food', label: '🍽️ 食事' },
    { value: 'transport', label: '🚗 交通費' },
    { value: 'accommodation', label: '🏨 宿泊' },
    { value: 'entertainment', label: '🎉 エンタメ' },
    { value: 'shopping', label: '🛍️ 買い物' },
    { value: 'other', label: '📝 その他' },
  ]

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <>
      <Header 
        title="支払いを追加"
        backButton={
          <Link href={`/events/${eventUrl}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        }
      />

      <main className="container mx-auto max-w-lg p-4 pb-20">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>支払い情報</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowOcrScanner(true)}
              >
                <Camera className="mr-2 h-4 w-4" />
                スキャン
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paid-by">支払った人 *</Label>
                <select
                  id="paid-by"
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={formData.paidBy}
                  onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                  required
                >
                  <option value="">選択してください</option>
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">金額 *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="1000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">カテゴリ</Label>
                <select
                  id="category"
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="居酒屋での飲み会"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>分割方法</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={splitType === 'equal' ? 'default' : 'outline'}
                  onClick={() => setSplitType('equal')}
                  className="flex-1"
                >
                  均等割り
                </Button>
                <Button
                  type="button"
                  variant={splitType === 'custom' ? 'default' : 'outline'}
                  onClick={() => setSplitType('custom')}
                  className="flex-1"
                >
                  個別設定
                </Button>
              </div>

              {splitType === 'equal' ? (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">
                    {participants.length}人で均等に分割
                  </p>
                  {formData.amount && (
                    <p className="mt-2 text-lg font-semibold">
                      1人あたり: ¥{Math.round(parseFloat(formData.amount) / participants.length).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Label className="min-w-[100px]">{p.name}</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={customSplits[p.id] || ''}
                        onChange={(e) => updateCustomSplit(p.id, e.target.value)}
                      />
                      <span className="text-sm">円</span>
                    </div>
                  ))}
                  {formData.amount && (
                    <div className="rounded-lg border p-3">
                      <p className="text-sm">
                        合計: ¥{getTotalSplit().toLocaleString()} / ¥{parseFloat(formData.amount).toLocaleString()}
                      </p>
                      {getTotalSplit() !== parseFloat(formData.amount) && (
                        <p className="mt-1 text-sm text-red-500">
                          差額: ¥{Math.abs(getTotalSplit() - parseFloat(formData.amount)).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!formData.paidBy || !formData.amount || isLoading}
          >
            <Calculator className="mr-2 h-5 w-5" />
            {isLoading ? '追加中...' : '支払いを追加'}
          </Button>
        </form>
      </main>

      {showOcrScanner && (
        <OcrScanner
          onClose={() => setShowOcrScanner(false)}
          onScanComplete={(data) => {
            if (data.totalAmount) {
              setFormData(prev => ({
                ...prev,
                amount: data.totalAmount!.toString(),
                description: data.items && data.items.length > 0 
                  ? `${data.items[0].name} 他${data.items.length}点`
                  : prev.description
              }))
            }
            setShowOcrScanner(false)
          }}
        />
      )}
    </>
  )
}