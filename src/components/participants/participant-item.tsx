'use client'

import React, { useState } from 'react'
import { logger } from '@/lib/utils/logger'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Edit2, 
  Check, 
  X, 
  UserCheck,
  Link2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/auth-provider'
import { getCurrentUserDisplayName } from '@/lib/supabase/api/profiles'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ParticipantItemProps {
  participant: {
    id: string
    name: string
    user_id?: string | null
    is_claimed?: boolean
    email?: string | null
  }
  eventId: string
  balance?: number
  isCurrentUser?: boolean
  canClaim?: boolean
  onUpdate?: () => void
  className?: string
}

export const ParticipantItem: React.FC<ParticipantItemProps> = ({
  participant,
  eventId,
  balance = 0,
  isCurrentUser = false,
  canClaim = false,
  onUpdate,
  className,
}) => {
  const { user } = useAuth()
  const supabase = createClient()
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState(participant.name)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdateName = async () => {
    if (newName.trim() === '' || newName === participant.name) {
      setIsEditing(false)
      setNewName(participant.name)
      return
    }

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('participants')
        .update({ name: newName.trim() })
        .eq('id', participant.id)

      if (error) throw error

      toast.success('名前を更新しました')
      setIsEditing(false)
      onUpdate?.()
    } catch (error) {
      logger.error('Error updating participant name:', error)
      toast.error('名前の更新に失敗しました')
      setNewName(participant.name)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClaimParticipant = async () => {
    if (!user) {
      toast.error('この機能を使用するにはログインが必要です')
      return
    }

    setIsUpdating(true)
    try {
      // まず、同じイベントで既に紐付けているか確認
      const { data: existingClaim } = await supabase
        .from('participants')
        .select('id, name')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()
      
      if (existingClaim) {
        toast.error(`このイベントには既に「${existingClaim.name}」として参加しています`)
        return
      }
      
      // ユーザーの表示名を取得
      const displayName = await getCurrentUserDisplayName()
      
      // 参加者を紐付けて名前も更新
      const { error } = await supabase
        .from('participants')
        .update({ 
          user_id: user.id,
          is_claimed: true,
          name: displayName // ユーザーの名前で上書き
        })
        .eq('id', participant.id)
        .is('user_id', null) // まだ誰も紐付けていない場合のみ

      if (error) {
        if (error.code === '23505') {
          toast.error('このイベントには既に参加しています')
        } else {
          throw error
        }
        return
      }

      toast.success(`「${displayName}」として登録しました`)
      onUpdate?.()
    } catch (error) {
      logger.error('Error claiming participant:', error)
      toast.error('登録に失敗しました')
    } finally {
      setIsUpdating(false)
    }
  }

  const formatBalance = (amount: number) => {
    const absAmount = Math.abs(amount)
    if (amount > 0) {
      return <span className="text-green-600">+¥{absAmount.toLocaleString()}</span>
    } else if (amount < 0) {
      return <span className="text-red-600">-¥{absAmount.toLocaleString()}</span>
    }
    return <span className="text-muted-foreground">¥0</span>
  }

  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-lg border",
      isCurrentUser && "bg-primary/5 border-primary/20",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          participant.user_id ? "bg-primary/10" : "bg-muted"
        )}>
          {participant.user_id ? (
            <UserCheck className="h-5 w-5 text-primary" />
          ) : (
            <User className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-col">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateName()
                  if (e.key === 'Escape') {
                    setIsEditing(false)
                    setNewName(participant.name)
                  }
                }}
                className="h-8 w-32"
                autoFocus
                disabled={isUpdating}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleUpdateName}
                disabled={isUpdating}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  setIsEditing(false)
                  setNewName(participant.name)
                }}
                disabled={isUpdating}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium">{participant.name}</span>
              {!participant.user_id && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-1">
            {participant.user_id && (
              <Badge variant="secondary" className="text-xs">
                <UserCheck className="h-3 w-3 mr-1" />
                登録済み
              </Badge>
            )}
            {isCurrentUser && (
              <Badge variant="default" className="text-xs">
                あなた
              </Badge>
            )}
            {!participant.user_id && user && !isCurrentUser && canClaim && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={handleClaimParticipant}
                disabled={isUpdating}
              >
                <Link2 className="h-3 w-3 mr-1" />
                自分として登録
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="font-semibold">
          {formatBalance(balance)}
        </div>
        <div className="text-xs text-muted-foreground">
          収支
        </div>
      </div>
    </div>
  )
}