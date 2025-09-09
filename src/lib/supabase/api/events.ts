import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/types'
import { nanoid } from 'nanoid'
import { validateUrlParam, validateEventName, sanitizeString } from '@/lib/utils/validation'

export const eventApi = {
  // ユーザーのイベント取得
  async getByUserId(userId: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },
  // イベント作成
  async create(data: Omit<Event, 'id' | 'unique_url' | 'created_at'> & { user_id?: string }) {
    // バリデーション
    const nameValidation = validateEventName(data.name)
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error)
    }
    
    const supabase = createClient()
    const uniqueUrl = nanoid(10)
    
    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        ...data,
        name: sanitizeString(data.name),
        description: data.description ? sanitizeString(data.description) : null,
        location: data.location ? sanitizeString(data.location) : null,
        unique_url: uniqueUrl,
        user_id: data.user_id || user?.id || null,
      })
      .select()
      .single()
    
    if (error) throw error
    return event
  },

  // イベント取得（URL）
  async getByUrl(url: string) {
    // URLパラメータのバリデーション
    const urlValidation = validateUrlParam(url)
    if (!urlValidation.isValid) {
      throw new Error(urlValidation.error)
    }
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('unique_url', url)
      .single()
    
    if (error) throw error
    return data
  },

  // イベント更新
  async update(id: string, data: Partial<Event>) {
    // 更新データのバリデーション
    if (data.name) {
      const nameValidation = validateEventName(data.name)
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.error)
      }
      data.name = sanitizeString(data.name)
    }
    
    if (data.description) {
      data.description = sanitizeString(data.description)
    }
    
    if (data.location) {
      data.location = sanitizeString(data.location)
    }
    
    const supabase = createClient()
    
    const { data: event, error } = await supabase
      .from('events')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return event
  },

  // イベント削除
  async delete(id: string) {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // リアルタイム購読
  subscribe(eventId: string, callback: (payload: unknown) => void) {
    const supabase = createClient()
    
    const subscription = supabase
      .channel(`event:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
        callback
      )
      .subscribe()
    
    return subscription
  },
}