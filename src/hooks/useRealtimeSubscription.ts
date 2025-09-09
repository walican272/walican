import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseRealtimeSubscriptionProps {
  eventId: string | null
  onUpdate: () => void
}

export function useRealtimeSubscription({ eventId, onUpdate }: UseRealtimeSubscriptionProps) {
  // コールバックをrefで保持してメモリリークを防ぐ
  const onUpdateRef = useRef(onUpdate)
  
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])
  
  useEffect(() => {
    if (!eventId) return

    const supabase = createClient()
    
    // 複数のテーブルの変更を監視
    const channel = supabase
      .channel(`event-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          // console.logを削除（本番環境での情報漏洩防止）
          onUpdateRef.current()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          onUpdateRef.current()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expense_splits',
        },
        () => {
          onUpdateRef.current()
        }
      )
      .subscribe()

    // クリーンアップを強化
    return () => {
      channel.unsubscribe().then(() => {
        supabase.removeChannel(channel)
      })
    }
  }, [eventId]) // onUpdateを依存配列から除外
}