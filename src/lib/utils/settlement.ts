import type { Participant, Expense, ExpenseSplit } from '@/types'

// 通貨計算を整数（最小単位）で行うためのヘルパー
const CURRENCY_PRECISION = 100 // 1円 = 100（小数点以下2桁まで対応）

export const toMinorUnit = (amount: number): number => {
  return Math.round(amount * CURRENCY_PRECISION)
}

export const toMajorUnit = (amount: number): number => {
  return Math.round(amount) / CURRENCY_PRECISION
}

export interface Balance {
  participant: Participant
  paid: number
  shouldPay: number
  balance: number
}

export interface Settlement {
  from: Participant
  to: Participant
  amount: number
}

export function calculateBalances(
  participants: Participant[],
  expenses: Expense[],
  expenseSplits?: ExpenseSplit[]
): Balance[] {
  // 各参加者の支払い合計を計算
  const paidByParticipant: Record<string, number> = {}
  const shouldPayByParticipant: Record<string, number> = {}

  // 初期化
  participants.forEach(p => {
    paidByParticipant[p.id] = 0
    shouldPayByParticipant[p.id] = 0
  })

  // 支払い額を集計（整数演算で精度を保つ）
  expenses.forEach(expense => {
    const payerId = expense.paid_by || expense.payer_id
    if (payerId) {
      const amountInMinor = toMinorUnit(expense.amount)
      paidByParticipant[payerId] = (paidByParticipant[payerId] || 0) + amountInMinor
    }
  })

  // 各経費について、参加者が払うべき金額を計算
  expenses.forEach(expense => {
    if (expense.split_type === 'custom' && expense.splits) {
      // カスタム分割の場合、splitsフィールドから分割情報を取得
      Object.entries(expense.splits).forEach(([participantId, amount]) => {
        const amountInMinor = toMinorUnit(amount as number)
        shouldPayByParticipant[participantId] = (shouldPayByParticipant[participantId] || 0) + amountInMinor
      })
    } else if (expenseSplits) {
      // expense_splitsテーブルからデータを取得
      const splitsForExpense = expenseSplits.filter(s => s.expense_id === expense.id)
      splitsForExpense.forEach(split => {
        const amountInMinor = toMinorUnit(split.amount)
        shouldPayByParticipant[split.participant_id] = (shouldPayByParticipant[split.participant_id] || 0) + amountInMinor
      })
    } else {
      // デフォルトは均等割り（整数演算で精度を保つ）
      const amountInMinor = toMinorUnit(expense.amount)
      const perPersonMinor = Math.floor(amountInMinor / participants.length)
      const remainder = amountInMinor - (perPersonMinor * participants.length)
      
      participants.forEach((p, index) => {
        // 余りを最初の人から順番に1円ずつ割り当て
        const extra = index < remainder ? 1 : 0
        shouldPayByParticipant[p.id] = (shouldPayByParticipant[p.id] || 0) + perPersonMinor + extra
      })
    }
  })

  // バランスを計算（最終的にメジャー単位に戻す）
  return participants.map(participant => ({
    participant,
    paid: toMajorUnit(paidByParticipant[participant.id] || 0),
    shouldPay: toMajorUnit(shouldPayByParticipant[participant.id] || 0),
    balance: toMajorUnit((paidByParticipant[participant.id] || 0) - (shouldPayByParticipant[participant.id] || 0))
  }))
}

export function calculateSettlements(balances: Balance[]): Settlement[] {
  const settlements: Settlement[] = []
  
  // 貸し借りを計算（借りている人と貸している人をマッチング）
  const debtors = balances.filter(b => b.balance < 0).map(b => ({ ...b }))
  const creditors = balances.filter(b => b.balance > 0).map(b => ({ ...b }))
  
  debtors.sort((a, b) => a.balance - b.balance) // 借金が多い順
  creditors.sort((a, b) => b.balance - a.balance) // 貸しが多い順
  
  let i = 0, j = 0
  
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    
    // 整数演算で精度を保つ
    const debtorBalanceMinor = toMinorUnit(Math.abs(debtor.balance))
    const creditorBalanceMinor = toMinorUnit(creditor.balance)
    const amountMinor = Math.min(debtorBalanceMinor, creditorBalanceMinor)
    const amount = toMajorUnit(amountMinor)
    
    if (amountMinor >= 100) { // 1円未満は無視（100 = 1円）
      settlements.push({
        from: debtor.participant,
        to: creditor.participant,
        amount: Math.round(amount)
      })
    }
    
    debtor.balance += amount
    creditor.balance -= amount
    
    if (Math.abs(debtor.balance) < 0.5) i++
    if (creditor.balance < 0.5) j++
  }
  
  return settlements
}