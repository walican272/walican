import type { Participant, Expense, ExpenseSplit } from '@/types'

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

  // 支払い額を集計
  expenses.forEach(expense => {
    paidByParticipant[expense.paid_by] = (paidByParticipant[expense.paid_by] || 0) + expense.amount
  })

  // 各経費について、参加者が払うべき金額を計算
  expenses.forEach(expense => {
    if (expense.split_type === 'custom' && expense.splits) {
      // カスタム分割の場合、splitsフィールドから分割情報を取得
      Object.entries(expense.splits).forEach(([participantId, amount]) => {
        shouldPayByParticipant[participantId] = (shouldPayByParticipant[participantId] || 0) + (amount as number)
      })
    } else if (expenseSplits) {
      // expense_splitsテーブルからデータを取得
      const splitsForExpense = expenseSplits.filter(s => s.expense_id === expense.id)
      splitsForExpense.forEach(split => {
        shouldPayByParticipant[split.participant_id] = (shouldPayByParticipant[split.participant_id] || 0) + split.amount
      })
    } else {
      // デフォルトは均等割り
      const perPerson = expense.amount / participants.length
      participants.forEach(p => {
        shouldPayByParticipant[p.id] = (shouldPayByParticipant[p.id] || 0) + perPerson
      })
    }
  })

  // バランスを計算
  return participants.map(participant => ({
    participant,
    paid: paidByParticipant[participant.id] || 0,
    shouldPay: shouldPayByParticipant[participant.id] || 0,
    balance: (paidByParticipant[participant.id] || 0) - (shouldPayByParticipant[participant.id] || 0)
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
    
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance)
    
    if (amount > 0.5) { // 1円未満は無視
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