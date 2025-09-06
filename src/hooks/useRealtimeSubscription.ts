import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseRealtimeSubscriptionProps {
  eventId: string | null
  onUpdate: () => void
}

export function useRealtimeSubscription({ eventId, onUpdate }: UseRealtimeSubscriptionProps) {
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
          console.log('Participants updated')
          onUpdate()
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
          console.log('Expenses updated')
          onUpdate()
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
          console.log('Expense splits updated')
          onUpdate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, onUpdate])
}