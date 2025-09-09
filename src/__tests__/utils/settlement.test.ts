import { calculateBalances, calculateSettlements } from '@/lib/utils/settlement'
import type { Participant, Expense, Balance } from '@/types'

describe('Settlement Utils', () => {
  const participants: Participant[] = [
    { id: '1', name: 'Alice', event_id: 'event1' },
    { id: '2', name: 'Bob', event_id: 'event1' },
    { id: '3', name: 'Charlie', event_id: 'event1' },
  ]

  describe('calculateBalances', () => {
    it('should calculate balances correctly for evenly split expenses', () => {
      const expenses: Expense[] = [
        {
          id: 'exp1',
          event_id: 'event1',
          description: 'Dinner',
          amount: 3000,
          payer_id: '1',
          split_type: 'even',
          created_at: new Date().toISOString(),
        },
      ]

      const balances = calculateBalances(participants, expenses)

      expect(balances).toHaveLength(3)
      // Alice paid 3000, shouldPay 1000, balance = 2000 (should receive)
      // Bob paid 0, shouldPay 1000, balance = -1000 (should pay)
      // Charlie paid 0, shouldPay 1000, balance = -1000 (should pay)
      expect(balances.find(b => b.participant.id === '1')?.balance).toBe(2000)
      expect(balances.find(b => b.participant.id === '2')?.balance).toBe(-1000)
      expect(balances.find(b => b.participant.id === '3')?.balance).toBe(-1000)
    })

    it('should calculate balances correctly for custom split expenses', () => {
      const expenses: Expense[] = [
        {
          id: 'exp1',
          event_id: 'event1',
          description: 'Hotel',
          amount: 6000,
          payer_id: '1',
          split_type: 'custom',
          created_at: new Date().toISOString(),
        },
      ]

      const expenseSplits = [
        { expense_id: 'exp1', participant_id: '1', amount: 3000 },
        { expense_id: 'exp1', participant_id: '2', amount: 2000 },
        { expense_id: 'exp1', participant_id: '3', amount: 1000 },
      ]

      const balances = calculateBalances(participants, expenses, expenseSplits)

      // Alice paid 6000, shouldPay 3000, balance = 3000 (should receive)
      // Bob paid 0, shouldPay 2000, balance = -2000 (should pay)
      // Charlie paid 0, shouldPay 1000, balance = -1000 (should pay)
      expect(balances.find(b => b.participant.id === '1')?.balance).toBe(3000)
      expect(balances.find(b => b.participant.id === '2')?.balance).toBe(-2000)
      expect(balances.find(b => b.participant.id === '3')?.balance).toBe(-1000)
    })

    it('should handle multiple expenses with mixed split types', () => {
      const expenses: Expense[] = [
        {
          id: 'exp1',
          event_id: 'event1',
          description: 'Dinner',
          amount: 3000,
          payer_id: '1',
          split_type: 'even',
          created_at: new Date().toISOString(),
        },
        {
          id: 'exp2',
          event_id: 'event1',
          description: 'Taxi',
          amount: 1500,
          payer_id: '2',
          split_type: 'even',
          created_at: new Date().toISOString(),
        },
      ]

      const balances = calculateBalances(participants, expenses)

      // Alice paid 3000, shouldPay 1500, balance = 1500 (should receive)
      // Bob paid 1500, shouldPay 1500, balance = 0 (even)
      // Charlie paid 0, shouldPay 1500, balance = -1500 (should pay)
      expect(balances.find(b => b.participant.id === '1')?.balance).toBe(1500)
      expect(balances.find(b => b.participant.id === '2')?.balance).toBe(0)
      expect(balances.find(b => b.participant.id === '3')?.balance).toBe(-1500)
    })

    it('should return zero balances when there are no expenses', () => {
      const balances = calculateBalances(participants, [])

      expect(balances).toHaveLength(3)
      balances.forEach(balance => {
        expect(balance.balance).toBe(0)
      })
    })
  })

  describe('calculateSettlements', () => {
    it('should calculate optimal settlements', () => {
      const balances: Balance[] = [
        { participant: participants[0], balance: 2000 },
        { participant: participants[1], balance: -1000 },
        { participant: participants[2], balance: -1000 },
      ]

      const settlements = calculateSettlements(balances)

      expect(settlements).toHaveLength(2)
      expect(settlements[0]).toEqual({
        from: participants[1],
        to: participants[0],
        amount: 1000,
      })
      expect(settlements[1]).toEqual({
        from: participants[2],
        to: participants[0],
        amount: 1000,
      })
    })

    it('should handle complex settlement scenarios', () => {
      const balances: Balance[] = [
        { participant: participants[0], balance: 3000 },
        { participant: participants[1], balance: -1000 },
        { participant: participants[2], balance: -2000 },
      ]

      const settlements = calculateSettlements(balances)

      expect(settlements).toHaveLength(2)
      const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0)
      expect(totalSettled).toBe(3000)
    })

    it('should return empty array when all balances are zero', () => {
      const balances: Balance[] = [
        { participant: participants[0], balance: 0 },
        { participant: participants[1], balance: 0 },
        { participant: participants[2], balance: 0 },
      ]

      const settlements = calculateSettlements(balances)

      expect(settlements).toHaveLength(0)
    })

    it('should handle two-person settlements correctly', () => {
      const twoParticipants = participants.slice(0, 2)
      const balances: Balance[] = [
        { participant: twoParticipants[0], balance: 500 },
        { participant: twoParticipants[1], balance: -500 },
      ]

      const settlements = calculateSettlements(balances)

      expect(settlements).toHaveLength(1)
      expect(settlements[0]).toEqual({
        from: twoParticipants[1],
        to: twoParticipants[0],
        amount: 500,
      })
    })
  })
})