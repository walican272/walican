import { renderHook } from '@testing-library/react'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { createClient } from '@/lib/supabase/client'

// Mock external dependencies
jest.mock('@/lib/supabase/client')

describe('useRealtimeSubscription', () => {
  const mockSupabase = {
    channel: jest.fn(),
    removeChannel: jest.fn(),
  }

  const mockChannel = {
    on: jest.fn(),
    subscribe: jest.fn(),
  }

  const mockOnUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    
    // Setup method chaining
    mockSupabase.channel.mockReturnValue(mockChannel)
    mockChannel.on.mockReturnValue(mockChannel)
    mockChannel.subscribe.mockReturnValue(mockChannel)
  })

  describe('subscription setup', () => {
    it('should set up subscription when eventId is provided', () => {
      renderHook(() => useRealtimeSubscription({ 
        eventId: 'event-123', 
        onUpdate: mockOnUpdate 
      }))

      expect(mockSupabase.channel).toHaveBeenCalledWith('event-event-123')
      expect(mockChannel.on).toHaveBeenCalledTimes(3)
      expect(mockChannel.subscribe).toHaveBeenCalledTimes(1)
    })

    it('should not set up subscription when eventId is null', () => {
      renderHook(() => useRealtimeSubscription({ 
        eventId: null, 
        onUpdate: mockOnUpdate 
      }))

      expect(mockSupabase.channel).not.toHaveBeenCalled()
      expect(mockChannel.on).not.toHaveBeenCalled()
      expect(mockChannel.subscribe).not.toHaveBeenCalled()
    })

    it('should not set up subscription when eventId is empty string', () => {
      renderHook(() => useRealtimeSubscription({ 
        eventId: '', 
        onUpdate: mockOnUpdate 
      }))

      expect(mockSupabase.channel).not.toHaveBeenCalled()
    })
  })

  describe('table subscriptions', () => {
    it('should subscribe to participants table changes', () => {
      renderHook(() => useRealtimeSubscription({ 
        eventId: 'event-123', 
        onUpdate: mockOnUpdate 
      }))

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: 'event_id=eq.event-123',
        },
        expect.any(Function)
      )
    })

    it('should subscribe to expenses table changes', () => {
      renderHook(() => useRealtimeSubscription({ 
        eventId: 'event-123', 
        onUpdate: mockOnUpdate 
      }))

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: 'event_id=eq.event-123',
        },
        expect.any(Function)
      )
    })

    it('should subscribe to expense_splits table changes', () => {
      renderHook(() => useRealtimeSubscription({ 
        eventId: 'event-123', 
        onUpdate: mockOnUpdate 
      }))

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expense_splits',
        },
        expect.any(Function)
      )
    })
  })

  describe('callback handling', () => {
    it('should call onUpdate when participants change', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      renderHook(() => useRealtimeSubscription({ 
        eventId: 'event-123', 
        onUpdate: mockOnUpdate 
      }))

      // Get the callback function passed to participants subscription
      const participantsCallback = mockChannel.on.mock.calls
        .find(call => call[1].table === 'participants')[2]

      // Simulate a change
      participantsCallback()

      expect(consoleSpy).toHaveBeenCalledWith('Participants updated')
      expect(mockOnUpdate).toHaveBeenCalledTimes(1)

      consoleSpy.mockRestore()
    })

    it('should call onUpdate when expenses change', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      renderHook(() => useRealtimeSubscription({ 
        eventId: 'event-123', 
        onUpdate: mockOnUpdate 
      }))

      // Get the callback function passed to expenses subscription
      const expensesCallback = mockChannel.on.mock.calls
        .find(call => call[1].table === 'expenses')[2]

      // Simulate a change
      expensesCallback()

      expect(consoleSpy).toHaveBeenCalledWith('Expenses updated')
      expect(mockOnUpdate).toHaveBeenCalledTimes(1)

      consoleSpy.mockRestore()
    })

    it('should call onUpdate when expense_splits change', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      renderHook(() => useRealtimeSubscription({ 
        eventId: 'event-123', 
        onUpdate: mockOnUpdate 
      }))

      // Get the callback function passed to expense_splits subscription
      const splitsCallback = mockChannel.on.mock.calls
        .find(call => call[1].table === 'expense_splits')[2]

      // Simulate a change
      splitsCallback()

      expect(consoleSpy).toHaveBeenCalledWith('Expense splits updated')
      expect(mockOnUpdate).toHaveBeenCalledTimes(1)

      consoleSpy.mockRestore()
    })

    it('should handle multiple rapid updates', () => {
      renderHook(() => useRealtimeSubscription({ 
        eventId: 'event-123', 
        onUpdate: mockOnUpdate 
      }))

      // Get all callback functions
      const participantsCallback = mockChannel.on.mock.calls
        .find(call => call[1].table === 'participants')[2]
      const expensesCallback = mockChannel.on.mock.calls
        .find(call => call[1].table === 'expenses')[2]

      // Simulate rapid updates
      participantsCallback()
      expensesCallback()
      participantsCallback()

      expect(mockOnUpdate).toHaveBeenCalledTimes(3)
    })
  })

  describe('cleanup', () => {
    it('should remove channel on unmount', () => {
      const { unmount } = renderHook(() => useRealtimeSubscription({ 
        eventId: 'event-123', 
        onUpdate: mockOnUpdate 
      }))

      unmount()

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
    })

    it('should remove old channel when eventId changes', () => {
      const { rerender } = renderHook(
        ({ eventId }) => useRealtimeSubscription({ eventId, onUpdate: mockOnUpdate }),
        { initialProps: { eventId: 'event-123' } }
      )

      const firstChannel = mockChannel

      // Reset mocks to track new calls
      mockSupabase.channel.mockClear()
      mockChannel.on.mockClear()
      mockChannel.subscribe.mockClear()

      // Change eventId
      rerender({ eventId: 'event-456' })

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(firstChannel)
      expect(mockSupabase.channel).toHaveBeenCalledWith('event-event-456')
    })

    it('should remove channel when eventId becomes null', () => {
      const { rerender } = renderHook(
        ({ eventId }) => useRealtimeSubscription({ eventId, onUpdate: mockOnUpdate }),
        { initialProps: { eventId: 'event-123' } }
      )

      rerender({ eventId: null })

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
    })

    it('should not create new subscription when eventId becomes null', () => {
      const { rerender } = renderHook(
        ({ eventId }) => useRealtimeSubscription({ eventId, onUpdate: mockOnUpdate }),
        { initialProps: { eventId: 'event-123' } }
      )

      // Clear initial setup calls
      mockSupabase.channel.mockClear()

      rerender({ eventId: null })

      // Should not create new channel
      expect(mockSupabase.channel).not.toHaveBeenCalled()
    })
  })

  describe('dependency updates', () => {
    it('should recreate subscription when onUpdate changes', () => {
      const newOnUpdate = jest.fn()

      const { rerender } = renderHook(
        ({ onUpdate }) => useRealtimeSubscription({ eventId: 'event-123', onUpdate }),
        { initialProps: { onUpdate: mockOnUpdate } }
      )

      // Clear initial setup calls
      mockSupabase.removeChannel.mockClear()
      mockSupabase.channel.mockClear()

      rerender({ onUpdate: newOnUpdate })

      expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(1)
      expect(mockSupabase.channel).toHaveBeenCalledWith('event-event-123')
    })

    it('should use latest onUpdate callback', () => {
      let callCount = 0
      const updateOnUpdate = () => {
        callCount++
      }

      const { rerender } = renderHook(
        ({ onUpdate }) => useRealtimeSubscription({ eventId: 'event-123', onUpdate }),
        { initialProps: { onUpdate: mockOnUpdate } }
      )

      rerender({ onUpdate: updateOnUpdate })

      // Get the latest callback
      const latestCallback = mockChannel.on.mock.calls
        .slice(-3) // Get last 3 calls from the new subscription
        .find(call => call[1].table === 'participants')[2]

      latestCallback()

      expect(callCount).toBe(1)
      expect(mockOnUpdate).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle undefined eventId', () => {
      renderHook(() => useRealtimeSubscription({ 
        eventId: undefined as any, 
        onUpdate: mockOnUpdate 
      }))

      expect(mockSupabase.channel).not.toHaveBeenCalled()
    })

    it('should handle special characters in eventId', () => {
      renderHook(() => useRealtimeSubscription({ 
        eventId: 'event-with-special@chars!', 
        onUpdate: mockOnUpdate 
      }))

      expect(mockSupabase.channel).toHaveBeenCalledWith('event-event-with-special@chars!')
    })

    it('should handle very long eventId', () => {
      const longEventId = 'event-' + 'x'.repeat(1000)
      
      renderHook(() => useRealtimeSubscription({ 
        eventId: longEventId, 
        onUpdate: mockOnUpdate 
      }))

      expect(mockSupabase.channel).toHaveBeenCalledWith(`event-${longEventId}`)
    })

    it('should handle subscription errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockChannel.subscribe.mockImplementation(() => {
        throw new Error('Subscription failed')
      })

      expect(() => {
        renderHook(() => useRealtimeSubscription({ 
          eventId: 'event-123', 
          onUpdate: mockOnUpdate 
        }))
      }).toThrow('Subscription failed')

      consoleSpy.mockRestore()
    })
  })

  describe('filter validation', () => {
    it('should use correct filter for participants', () => {
      renderHook(() => useRealtimeSubscription({ 
        eventId: 'event-123', 
        onUpdate: mockOnUpdate 
      }))

      const participantsCall = mockChannel.on.mock.calls
        .find(call => call[1].table === 'participants')

      expect(participantsCall[1].filter).toBe('event_id=eq.event-123')
    })

    it('should use correct filter for expenses', () => {
      renderHook(() => useRealtimeSubscription({ 
        eventId: 'event-123', 
        onUpdate: mockOnUpdate 
      }))

      const expensesCall = mockChannel.on.mock.calls
        .find(call => call[1].table === 'expenses')

      expect(expensesCall[1].filter).toBe('event_id=eq.event-123')
    })

    it('should not filter expense_splits by event_id', () => {
      renderHook(() => useRealtimeSubscription({ 
        eventId: 'event-123', 
        onUpdate: mockOnUpdate 
      }))

      const splitsCall = mockChannel.on.mock.calls
        .find(call => call[1].table === 'expense_splits')

      expect(splitsCall[1]).not.toHaveProperty('filter')
    })
  })
})