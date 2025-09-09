'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ParticipantItem } from './participant-item'
import { Users, UserPlus, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/auth-provider'
import { toast } from 'sonner'
import { calculateBalances } from '@/lib/utils/settlement'

interface Participant {
  id: string
  event_id: string
  name: string
  user_id?: string | null
  is_claimed?: boolean
  email?: string | null
  created_at?: string
}

interface ParticipantsListProps {
  eventId: string
  isQuickMode?: boolean
  className?: string
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  eventId,
  isQuickMode = false,
  className,
}) => {
  const { user } = useAuth()
  const supabase = createClient()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newParticipantName, setNewParticipantName] = useState('')

  const loadParticipants = async () => {
    try {
      // 参加者一覧を取得
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      if (participantsError) throw participantsError

      setParticipants(participantsData || [])

      // 支出データを取得して収支を計算
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_splits (
            participant_id,
            amount
          )
        `)
        .eq('event_id', eventId)

      if (expensesError) throw expensesError

      // 収支を計算
      const balanceList = calculateBalances(
        participantsData || [],
        expensesData || []
      )
      
      // Balance配列をRecord<string, number>に変換
      const balanceMap: Record<string, number> = {}
      balanceList.forEach(b => {
        balanceMap[b.participant.id] = b.balance
      })
      setBalances(balanceMap)
    } catch (error) {
      console.error('Error loading participants:', error)
      toast.error('参加者の読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddParticipant = async () => {
    if (!newParticipantName.trim()) {
      toast.error('名前を入力してください')
      return
    }

    setIsAdding(true)
    try {
      const { error } = await supabase
        .from('participants')
        .insert({
          event_id: eventId,
          name: newParticipantName.trim(),
          user_id: null, // 後から紐付け可能
        })

      if (error) throw error

      toast.success('参加者を追加しました')
      setNewParticipantName('')
      await loadParticipants()
    } catch (error) {
      console.error('Error adding participant:', error)
      toast.error('参加者の追加に失敗しました')
    } finally {
      setIsAdding(false)
    }
  }

  useEffect(() => {
    loadParticipants()

    // リアルタイム更新の設定
    const channel = supabase
      .channel(`participants:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          loadParticipants()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  const currentUserParticipant = participants.find(
    p => p.user_id === user?.id
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          参加者一覧
          <span className="text-sm text-muted-foreground">
            ({participants.length}人)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* クイックモードの説明 */}
        {isQuickMode && (
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium">参加者名は自由に変更できます</p>
              <p className="text-xs mt-1 opacity-80">
                名前の横の編集ボタンをクリックして変更してください。
                ログインすると「自分として登録」もできます。
              </p>
            </div>
          </div>
        )}

        {/* 参加者リスト */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            読み込み中...
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            まだ参加者がいません
          </div>
        ) : (
          <div className="space-y-2">
            {participants.map((participant) => (
              <ParticipantItem
                key={participant.id}
                participant={participant}
                eventId={eventId}
                balance={balances[participant.id] || 0}
                isCurrentUser={participant.id === currentUserParticipant?.id}
                onUpdate={loadParticipants}
              />
            ))}
          </div>
        )}

        {/* 参加者追加フォーム */}
        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="新しい参加者の名前"
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isAdding) {
                  handleAddParticipant()
                }
              }}
              disabled={isAdding}
            />
            <Button
              onClick={handleAddParticipant}
              disabled={isAdding || !newParticipantName.trim()}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}