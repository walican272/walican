'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, UserPlus } from 'lucide-react'
import { participantApi } from '@/lib/supabase/api/participants'

interface ParticipantModalProps {
  eventId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ParticipantModal({ eventId, isOpen, onClose, onSuccess }: ParticipantModalProps) {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('名前を入力してください')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await participantApi.create(eventId, name.trim())
      setName('')
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error adding participant:', err)
      setError('参加者の追加に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">参加者を追加</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="participant-name">名前</Label>
            <Input
              id="participant-name"
              type="text"
              placeholder="例: 田中太郎"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {isLoading ? '追加中...' : '追加'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}