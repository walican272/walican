'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ParticipantSelector } from './participant-selector'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Receipt } from 'lucide-react'
import type { Participant } from '@/types'

const EXPENSE_CATEGORIES = [
  { value: 'food', label: '🍽️ 食事' },
  { value: 'transport', label: '🚗 交通費' },
  { value: 'accommodation', label: '🏨 宿泊' },
  { value: 'activity', label: '🎯 アクティビティ' },
  { value: 'shopping', label: '🛍️ 買い物' },
  { value: 'other', label: '📝 その他' },
] as const

interface ExpenseCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  eventId: string
}

export function ExpenseCreateModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  eventId 
}: ExpenseCreateModalProps) {
  const supabase = createClient()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // フォームデータ
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('other')
  const [paidBy, setPaidBy] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [splitType, setSplitType] = useState<'equal' | 'custom' | 'percentage'>('equal')
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (isOpen && eventId) {
      loadParticipants()
    }
  }, [isOpen, eventId])

  const loadParticipants = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setParticipants(data || [])
      // デフォルトで全員を選択
      setSelectedParticipants(data?.map(p => p.id) || [])
      // 最初の参加者を支払い者として設定
      if (data && data.length > 0) {
        setPaidBy(data[0].id)
      }
    } catch (error) {
      console.error('Error loading participants:', error)
      toast.error('参加者の読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomAmountChange = (participantId: string, amount: number) => {
    setCustomAmounts(prev => ({
      ...prev,
      [participantId]: amount
    }))
  }

  const calculateSplits = () => {
    const totalAmount = parseFloat(amount) || 0
    const splits: Array<{ participant_id: string; amount: number }> = []

    if (selectedParticipants.length === 0) return splits

    selectedParticipants.forEach(participantId => {
      let splitAmount = 0

      switch (splitType) {
        case 'equal':
          splitAmount = Math.round(totalAmount / selectedParticipants.length)
          break
        case 'custom':
          splitAmount = customAmounts[participantId] || 0
          break
        case 'percentage':
          // パーセンテージの場合はcustomAmountsに既に計算済みの値が入っている
          splitAmount = customAmounts[participantId] || 0
          break
      }

      if (splitAmount > 0) {
        splits.push({
          participant_id: participantId,
          amount: splitAmount
        })
      }
    })

    return splits
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // バリデーション
    if (!paidBy) {
      toast.error('支払い者を選択してください')
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('正しい金額を入力してください')
      return
    }

    if (selectedParticipants.length === 0) {
      toast.error('少なくとも1人の参加者を選択してください')
      return
    }

    setIsSaving(true)
    try {
      // 支払い分割を計算
      const splits = calculateSplits()

      // RPC関数を使用してatomicに作成
      const { error } = await supabase.rpc('create_expense_with_splits', {
        expense_data: {
          event_id: eventId,
          paid_by: paidBy,
          amount: numAmount,
          currency: 'JPY',
          category: category,
          description: description || null,
        },
        splits_data: splits
      })

      if (error) throw error

      toast.success('支払いを記録しました')
      onSuccess()
      handleClose()
    } catch (error) {
      console.error('Error creating expense:', error)
      toast.error('支払いの記録に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    // フォームをリセット
    setDescription('')
    setAmount('')
    setCategory('other')
    setPaidBy(participants[0]?.id || '')
    setSelectedParticipants(participants.map(p => p.id))
    setSplitType('equal')
    setCustomAmounts({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            支払いを記録
          </DialogTitle>
          <DialogDescription>
            誰が何を支払ったか記録します。支払い対象者を選択できます。
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 支払い者 */}
            <div className="space-y-2">
              <Label htmlFor="paid-by">支払い者 *</Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger id="paid-by">
                  <SelectValue placeholder="支払い者を選択" />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((participant) => (
                    <SelectItem key={participant.id} value={participant.id}>
                      {participant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 金額 */}
            <div className="space-y-2">
              <Label htmlFor="amount">金額 (円) *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                min="1"
                step="1"
                required
              />
            </div>

            {/* カテゴリ */}
            <div className="space-y-2">
              <Label htmlFor="category">カテゴリ</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 説明 */}
            <div className="space-y-2">
              <Label htmlFor="description">説明（任意）</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例: 居酒屋での夕食代"
                rows={2}
              />
            </div>

            {/* 支払い対象者選択 */}
            <ParticipantSelector
              participants={participants}
              selectedParticipants={selectedParticipants}
              onSelectionChange={setSelectedParticipants}
              customAmounts={customAmounts}
              onCustomAmountChange={handleCustomAmountChange}
              totalAmount={parseFloat(amount) || 0}
              splitType={splitType}
              onSplitTypeChange={setSplitType}
            />

            {/* アクションボタン */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSaving}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '記録する'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}