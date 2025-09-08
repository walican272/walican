export interface Event {
  id: string
  unique_url: string
  name: string
  date: string
  description?: string
  location?: string
  currency?: string
  created_at: string
}

export interface Participant {
  id: string
  event_id: string
  name: string
  email?: string
  created_at: string
}

export interface Expense {
  id: string
  event_id: string
  paid_by: string // participant_id
  amount: number
  currency: string
  category: ExpenseCategory
  description?: string
  receipt_url?: string
  split_type?: string
  splits?: Record<string, number>
  created_at: string
}

export interface ExpenseSplit {
  expense_id: string
  participant_id: string
  amount: number
  is_settled: boolean
}

export interface Settlement {
  id: string
  event_id: string
  from_participant: string
  to_participant: string
  amount: number
  currency: string
  settled_at?: string
  status: SettlementStatus
}

export type ExpenseCategory = 
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'entertainment'
  | 'shopping'
  | 'other'

export type SettlementStatus = 'pending' | 'completed'

export type Currency = 'JPY' | 'USD' | 'EUR' | 'GBP' | 'CNY' | 'KRW'

export const CURRENCIES: Record<Currency, { symbol: string; name: string }> = {
  JPY: { symbol: '¥', name: '日本円' },
  USD: { symbol: '$', name: '米ドル' },
  EUR: { symbol: '€', name: 'ユーロ' },
  GBP: { symbol: '£', name: '英ポンド' },
  CNY: { symbol: '¥', name: '人民元' },
  KRW: { symbol: '₩', name: 'ウォン' },
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; icon: string }> = {
  food: { label: '食事', icon: '🍽️' },
  transport: { label: '交通費', icon: '🚗' },
  accommodation: { label: '宿泊', icon: '🏨' },
  entertainment: { label: 'エンタメ', icon: '🎉' },
  shopping: { label: '買い物', icon: '🛍️' },
  other: { label: 'その他', icon: '📝' },
}