'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { expenseApi } from '@/lib/supabase/api/expenses'
import { participantApi } from '@/lib/supabase/api/participants'
import type { Expense, Participant } from '@/types'

interface ExpenseEditModalProps {
  expense: Expense | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  eventId: string
}

export function ExpenseEditModal({ expense, isOpen, onClose, onSuccess, eventId }: ExpenseEditModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'other',
    paid_by: '',
    split_type: 'equal' as 'equal' | 'custom',
    splits: {} as Record<string, number>
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && eventId) {
      loadParticipants()
    }
  }, [isOpen, eventId])

  useEffect(() => {
    if (expense && participants.length > 0) {
      // 既存の支払いデータをフォームに設定
      setFormData({
        description: expense.description || '',
        amount: expense.amount.toString(),
        category: expense.category,
        paid_by: expense.paid_by,
        split_type: expense.split_type || 'equal',
        splits: expense.splits || {}
      })
    }
  }, [expense, participants])

  const loadParticipants = async () => {
    try {
      const data = await participantApi.getByEventId(eventId)
      setParticipants(data)
    } catch (error) {
      console.error('Error loading participants:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.paid_by) {
      setError('支払者を選択してください')
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      setError('正しい金額を入力してください')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const updateData = {
        description: formData.description,
        amount,
        category: formData.category,
        paid_by: formData.paid_by,
        split_type: formData.split_type,
        splits: formData.split_type === 'custom' ? formData.splits : {}
      }

      if (expense) {
        await expenseApi.update(expense.id, updateData)
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (error: any) {
      setError(error.message || '保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!expense || !confirm('この支払いを削除してもよろしいですか？')) return

    setIsLoading(true)
    try {
      await expenseApi.delete(expense.id)
      onSuccess()
      onClose()
    } catch (error: any) {
      setError(error.message || '削除に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: 'other',
      paid_by: '',
      split_type: 'equal',
      splits: {}
    })
    setError('')
  }

  const handleSplitChange = (participantId: string, value: string) => {
    const amount = parseFloat(value)
    if (!isNaN(amount) && amount >= 0) {
      setFormData(prev => ({
        ...prev,
        splits: {
          ...prev.splits,
          [participantId]: amount
        }
      }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>支払いを編集</DialogTitle>
          <DialogDescription>
            支払い内容を修正できます
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Input
              id="description"
              placeholder="例: 夕食代"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">金額</Label>
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
            <Label htmlFor="category">カテゴリー</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="カテゴリーを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food">🍽️ 食事</SelectItem>
                <SelectItem value="transport">🚗 交通費</SelectItem>
                <SelectItem value="accommodation">🏨 宿泊</SelectItem>
                <SelectItem value="entertainment">🎉 エンタメ</SelectItem>
                <SelectItem value="shopping">🛍️ 買い物</SelectItem>
                <SelectItem value="other">📝 その他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paid_by">支払者</Label>
            <Select 
              value={formData.paid_by} 
              onValueChange={(value) => setFormData({ ...formData, paid_by: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="支払者を選択" />
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

          <div className="space-y-2">
            <Label>分割方法</Label>
            <RadioGroup 
              value={formData.split_type} 
              onValueChange={(value: 'equal' | 'custom') => setFormData({ ...formData, split_type: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="equal" id="equal" />
                <Label htmlFor="equal">均等に分割</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">個別に設定</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.split_type === 'custom' && participants.length > 0 && (
            <div className="space-y-2">
              <Label>個別の金額</Label>
              <div className="space-y-2 rounded-lg border p-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between">
                    <Label htmlFor={`split-${participant.id}`} className="text-sm">
                      {participant.name}
                    </Label>
                    <Input
                      id={`split-${participant.id}`}
                      type="number"
                      className="w-24"
                      placeholder="0"
                      value={formData.splits[participant.id] || ''}
                      onChange={(e) => handleSplitChange(participant.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </Button>
            {expense && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isLoading}
              >
                削除
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}