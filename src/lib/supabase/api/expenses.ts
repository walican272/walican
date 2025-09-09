import { createClient } from '@/lib/supabase/client'
import type { Expense, ExpenseSplit } from '@/types'
import { validateUUID, validateAmount, sanitizeString } from '@/lib/utils/validation'

export const expenseApi = {
  // 支払い追加（原子的トランザクション）
  async create(data: Omit<Expense, 'id' | 'created_at'>, splits?: ExpenseSplit[]) {
    // バリデーション
    const eventValidation = validateUUID(data.event_id)
    if (!eventValidation.isValid) {
      throw new Error('無効なイベントIDです')
    }
    
    const amountValidation = validateAmount(data.amount)
    if (!amountValidation.isValid) {
      throw new Error(amountValidation.error)
    }
    
    const supabase = createClient()
    
    // DBファンクションを使用して原子的に処理
    const expenseData = {
      ...data,
      description: data.description ? sanitizeString(data.description) : null,
    }
    
    const splitsData = splits?.map(split => ({
      participant_id: split.participant_id,
      amount: split.amount,
      is_settled: split.is_settled || false,
    })) || []
    
    const { data: result, error } = await supabase
      .rpc('create_expense_with_splits', {
        expense_data: expenseData,
        splits_data: splitsData,
      })
    
    if (error) throw error
    return result
  },

  // イベントの支払い一覧取得
  async getByEventId(eventId: string) {
    // イベントIDのバリデーション
    const validation = validateUUID(eventId)
    if (!validation.isValid) {
      throw new Error('無効なイベントIDです')
    }
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        expense_splits (*)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // 支払い更新
  async update(id: string, data: Partial<Expense>) {
    const supabase = createClient()
    
    const { data: expense, error } = await supabase
      .from('expenses')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return expense
  },

  // 支払い削除
  async delete(id: string) {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // 均等割り計算ヘルパー
  createEqualSplits(amount: number, participantIds: string[]): ExpenseSplit[] {
    const splitAmount = amount / participantIds.length
    return participantIds.map(participantId => ({
      expense_id: '', // 後で設定
      participant_id: participantId,
      amount: splitAmount,
      is_settled: false,
    }))
  },

  // リアルタイム購読
  subscribe(eventId: string, callback: (payload: unknown) => void) {
    const supabase = createClient()
    
    const subscription = supabase
      .channel(`expenses:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `event_id=eq.${eventId}`,
        },
        callback
      )
      .subscribe()
    
    return subscription
  },
}