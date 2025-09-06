import { createClient } from '@/lib/supabase/client'
import type { Participant } from '@/types'

export const participantApi = {
  // 参加者追加
  async create(eventId: string, name: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('participants')
      .insert({
        event_id: eventId,
        name,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // イベントの参加者一覧取得
  async getByEventId(eventId: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // 参加者更新
  async update(id: string, name: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('participants')
      .update({ name })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 参加者削除
  async delete(id: string) {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // リアルタイム購読
  subscribe(eventId: string, callback: (payload: any) => void) {
    const supabase = createClient()
    
    const subscription = supabase
      .channel(`participants:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `event_id=eq.${eventId}`,
        },
        callback
      )
      .subscribe()
    
    return subscription
  },
}