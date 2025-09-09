import { expenseApi } from '@/lib/supabase/api/expenses'
import { createClient } from '@/lib/supabase/client'

// Mock external dependencies
jest.mock('@/lib/supabase/client')

describe('expenseApi', () => {
  const mockSupabase = {
    from: jest.fn(),
    channel: jest.fn(),
  }

  const mockQuery = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    single: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    
    // Setup method chaining
    mockSupabase.from.mockReturnValue(mockQuery)
    mockQuery.select.mockReturnValue(mockQuery)
    mockQuery.eq.mockReturnValue(mockQuery)
    mockQuery.order.mockReturnValue(mockQuery)
    mockQuery.insert.mockReturnValue(mockQuery)
    mockQuery.update.mockReturnValue(mockQuery)
    mockQuery.delete.mockReturnValue(mockQuery)
    mockQuery.single.mockReturnValue(mockQuery)
  })

  describe('create', () => {
    const mockExpenseData = {
      event_id: 'event-123',
      payer_id: 'user-123',
      amount: 5000,
      description: 'Test expense',
    }

    it('should create expense without splits', async () => {
      const mockCreatedExpense = { 
        id: 'expense-123', 
        ...mockExpenseData 
      }
      
      mockQuery.single.mockResolvedValue({ data: mockCreatedExpense, error: null })
      
      const result = await expenseApi.create(mockExpenseData)
      
      expect(mockSupabase.from).toHaveBeenCalledWith('expenses')
      expect(mockQuery.insert).toHaveBeenCalledWith(mockExpenseData)
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(mockCreatedExpense)
    })

    it('should create expense with splits', async () => {
      const mockExpense = { id: 'expense-123', ...mockExpenseData }
      const mockSplits = [
        { participant_id: 'user-1', amount: 2500, is_settled: false },
        { participant_id: 'user-2', amount: 2500, is_settled: false },
      ]
      
      // Mock expense creation
      mockSupabase.from
        .mockReturnValueOnce(mockQuery) // First call for expenses
        .mockReturnValueOnce(mockQuery) // Second call for expense_splits
      
      mockQuery.single.mockResolvedValueOnce({ data: mockExpense, error: null })
      mockQuery.insert.mockResolvedValueOnce({ error: null })
      
      const result = await expenseApi.create(mockExpenseData, mockSplits)
      
      expect(mockSupabase.from).toHaveBeenNthCalledWith(1, 'expenses')
      expect(mockSupabase.from).toHaveBeenNthCalledWith(2, 'expense_splits')
      
      expect(mockQuery.insert).toHaveBeenNthCalledWith(1, mockExpenseData)
      expect(mockQuery.insert).toHaveBeenNthCalledWith(2, [
        { ...mockSplits[0], expense_id: 'expense-123' },
        { ...mockSplits[1], expense_id: 'expense-123' },
      ])
      
      expect(result).toEqual(mockExpense)
    })

    it('should throw error when expense creation fails', async () => {
      const mockError = new Error('Expense creation failed')
      mockQuery.single.mockResolvedValue({ data: null, error: mockError })
      
      await expect(expenseApi.create(mockExpenseData)).rejects.toThrow('Expense creation failed')
    })

    it('should throw error when splits creation fails', async () => {
      const mockExpense = { id: 'expense-123', ...mockExpenseData }
      const mockSplits = [{ participant_id: 'user-1', amount: 5000, is_settled: false }]
      const mockSplitsError = new Error('Splits creation failed')
      
      mockSupabase.from
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockQuery)
      
      mockQuery.single.mockResolvedValue({ data: mockExpense, error: null })
      mockQuery.insert.mockResolvedValueOnce({ error: null }) // expense success
      mockQuery.insert.mockResolvedValueOnce({ error: mockSplitsError }) // splits fail
      
      await expect(expenseApi.create(mockExpenseData, mockSplits)).rejects.toThrow('Splits creation failed')
    })

    it('should handle empty splits array', async () => {
      const mockExpense = { id: 'expense-123', ...mockExpenseData }
      
      mockQuery.single.mockResolvedValue({ data: mockExpense, error: null })
      
      const result = await expenseApi.create(mockExpenseData, [])
      
      expect(mockSupabase.from).toHaveBeenCalledTimes(1) // Only expenses table
      expect(result).toEqual(mockExpense)
    })
  })

  describe('getByEventId', () => {
    it('should fetch expenses with splits for an event', async () => {
      const mockExpenses = [
        {
          id: 'expense-1',
          event_id: 'event-123',
          amount: 3000,
          expense_splits: [
            { participant_id: 'user-1', amount: 1500 },
            { participant_id: 'user-2', amount: 1500 },
          ],
        },
        {
          id: 'expense-2',
          event_id: 'event-123',
          amount: 2000,
          expense_splits: [
            { participant_id: 'user-1', amount: 2000 },
          ],
        },
      ]
      
      mockQuery.order.mockResolvedValue({ data: mockExpenses, error: null })
      
      const result = await expenseApi.getByEventId('event-123')
      
      expect(mockSupabase.from).toHaveBeenCalledWith('expenses')
      expect(mockQuery.select).toHaveBeenCalledWith(`
        *,
        expense_splits (*)
      `)
      expect(mockQuery.eq).toHaveBeenCalledWith('event_id', 'event-123')
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockExpenses)
    })

    it('should return empty array when no expenses found', async () => {
      mockQuery.order.mockResolvedValue({ data: null, error: null })
      
      const result = await expenseApi.getByEventId('event-123')
      
      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockError = new Error('Query failed')
      mockQuery.order.mockResolvedValue({ data: null, error: mockError })
      
      await expect(expenseApi.getByEventId('event-123')).rejects.toThrow('Query failed')
    })

    it('should handle empty expenses array', async () => {
      mockQuery.order.mockResolvedValue({ data: [], error: null })
      
      const result = await expenseApi.getByEventId('event-123')
      
      expect(result).toEqual([])
    })
  })

  describe('update', () => {
    it('should update expense successfully', async () => {
      const updateData = { amount: 6000, description: 'Updated expense' }
      const mockUpdatedExpense = { 
        id: 'expense-123', 
        ...updateData,
        event_id: 'event-123' 
      }
      
      mockQuery.single.mockResolvedValue({ data: mockUpdatedExpense, error: null })
      
      const result = await expenseApi.update('expense-123', updateData)
      
      expect(mockSupabase.from).toHaveBeenCalledWith('expenses')
      expect(mockQuery.update).toHaveBeenCalledWith(updateData)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'expense-123')
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(mockUpdatedExpense)
    })

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed')
      mockQuery.single.mockResolvedValue({ data: null, error: mockError })
      
      await expect(expenseApi.update('expense-123', {})).rejects.toThrow('Update failed')
    })

    it('should handle partial updates', async () => {
      const partialUpdate = { description: 'New description only' }
      const mockUpdatedExpense = { 
        id: 'expense-123',
        amount: 5000,
        description: 'New description only',
        event_id: 'event-123'
      }
      
      mockQuery.single.mockResolvedValue({ data: mockUpdatedExpense, error: null })
      
      const result = await expenseApi.update('expense-123', partialUpdate)
      
      expect(mockQuery.update).toHaveBeenCalledWith(partialUpdate)
      expect(result).toEqual(mockUpdatedExpense)
    })
  })

  describe('delete', () => {
    it('should delete expense successfully', async () => {
      mockQuery.delete.mockResolvedValue({ error: null })
      
      await expenseApi.delete('expense-123')
      
      expect(mockSupabase.from).toHaveBeenCalledWith('expenses')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'expense-123')
    })

    it('should throw error when deletion fails', async () => {
      const mockError = new Error('Deletion failed')
      mockQuery.delete.mockResolvedValue({ error: mockError })
      
      await expect(expenseApi.delete('expense-123')).rejects.toThrow('Deletion failed')
    })
  })

  describe('createEqualSplits', () => {
    it('should create equal splits for participants', () => {
      const participantIds = ['user-1', 'user-2', 'user-3']
      const amount = 3000
      
      const result = expenseApi.createEqualSplits(amount, participantIds)
      
      expect(result).toHaveLength(3)
      expect(result).toEqual([
        {
          expense_id: '',
          participant_id: 'user-1',
          amount: 1000,
          is_settled: false,
        },
        {
          expense_id: '',
          participant_id: 'user-2',
          amount: 1000,
          is_settled: false,
        },
        {
          expense_id: '',
          participant_id: 'user-3',
          amount: 1000,
          is_settled: false,
        },
      ])
    })

    it('should handle uneven divisions', () => {
      const participantIds = ['user-1', 'user-2', 'user-3']
      const amount = 1000
      
      const result = expenseApi.createEqualSplits(amount, participantIds)
      
      expect(result).toHaveLength(3)
      result.forEach(split => {
        expect(split.amount).toBeCloseTo(333.33, 2)
      })
    })

    it('should handle single participant', () => {
      const participantIds = ['user-1']
      const amount = 5000
      
      const result = expenseApi.createEqualSplits(amount, participantIds)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        expense_id: '',
        participant_id: 'user-1',
        amount: 5000,
        is_settled: false,
      })
    })

    it('should handle zero amount', () => {
      const participantIds = ['user-1', 'user-2']
      const amount = 0
      
      const result = expenseApi.createEqualSplits(amount, participantIds)
      
      expect(result).toHaveLength(2)
      result.forEach(split => {
        expect(split.amount).toBe(0)
      })
    })

    it('should handle empty participants array', () => {
      const result = expenseApi.createEqualSplits(1000, [])
      
      expect(result).toEqual([])
    })
  })

  describe('subscribe', () => {
    it('should set up real-time subscription for event expenses', () => {
      const mockCallback = jest.fn()
      const mockSubscription = { unsubscribe: jest.fn() }
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnValue(mockSubscription),
      }
      
      mockSupabase.channel.mockReturnValue(mockChannel)
      
      const result = expenseApi.subscribe('event-123', mockCallback)
      
      expect(mockSupabase.channel).toHaveBeenCalledWith('expenses:event-123')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: 'event_id=eq.event-123',
        },
        mockCallback
      )
      expect(mockChannel.subscribe).toHaveBeenCalled()
      expect(result).toBe(mockSubscription)
    })

    it('should handle subscription with different event IDs', () => {
      const mockCallback = jest.fn()
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnValue({}),
      }
      
      mockSupabase.channel.mockReturnValue(mockChannel)
      
      expenseApi.subscribe('different-event', mockCallback)
      
      expect(mockSupabase.channel).toHaveBeenCalledWith('expenses:different-event')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          filter: 'event_id=eq.different-event',
        }),
        mockCallback
      )
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockQuery.order.mockRejectedValue(new Error('Network error'))
      
      await expect(expenseApi.getByEventId('event-123')).rejects.toThrow('Network error')
    })

    it('should handle transaction rollback scenarios', async () => {
      const mockExpense = { id: 'expense-123', amount: 5000 }
      const mockSplits = [{ participant_id: 'user-1', amount: 5000, is_settled: false }]
      
      mockSupabase.from
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockQuery)
      
      mockQuery.single.mockResolvedValue({ data: mockExpense, error: null })
      mockQuery.insert.mockResolvedValueOnce({ error: null })
      mockQuery.insert.mockResolvedValueOnce({ error: new Error('Splits failed') })
      
      await expect(expenseApi.create({}, mockSplits)).rejects.toThrow('Splits failed')
    })

    it('should handle malformed expense data', async () => {
      mockQuery.single.mockResolvedValue({ data: undefined, error: null })
      
      const result = await expenseApi.update('expense-123', {})
      
      expect(result).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should handle very large amounts', () => {
      const participantIds = ['user-1', 'user-2']
      const amount = 999999999
      
      const result = expenseApi.createEqualSplits(amount, participantIds)
      
      expect(result).toHaveLength(2)
      expect(result[0].amount + result[1].amount).toBe(amount)
    })

    it('should handle decimal amounts in splits', () => {
      const participantIds = ['user-1', 'user-2', 'user-3']
      const amount = 10.50
      
      const result = expenseApi.createEqualSplits(amount, participantIds)
      
      expect(result).toHaveLength(3)
      expect(result[0].amount).toBeCloseTo(3.5, 2)
    })

    it('should handle duplicate participant IDs', () => {
      const participantIds = ['user-1', 'user-1', 'user-2']
      const amount = 300
      
      const result = expenseApi.createEqualSplits(amount, participantIds)
      
      expect(result).toHaveLength(3)
      expect(result[0].amount).toBe(100)
      expect(result[1].amount).toBe(100)
      expect(result[2].amount).toBe(100)
    })
  })
})