import { createClient } from '@/lib/supabase/client'
import type { Expense, ExpenseSplit } from '@/types'

export const expenseApi = {
  // 支払い追加
  async create(data: Omit<Expense, 'id' | 'created_at'>, splits?: ExpenseSplit[]) {
    const supabase = createClient()
    
    // トランザクション的に処理
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert(data)
      .select()
      .single()
    
    if (expenseError) throw expenseError
    
    // 分割情報がある場合は追加
    if (splits && splits.length > 0) {
      const splitsWithExpenseId = splits.map(split => ({
        ...split,
        expense_id: expense.id,
      }))
      
      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(splitsWithExpenseId)
      
      if (splitsError) throw splitsError
    }
    
    return expense
  },

  // イベントの支払い一覧取得
  async getByEventId(eventId: string) {
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