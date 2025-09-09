import { participantApi } from '@/lib/supabase/api/participants'
import { createClient } from '@/lib/supabase/client'

// Mock external dependencies
jest.mock('@/lib/supabase/client')

describe('participantApi', () => {
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
    
    // Setup method chaining for all operations
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
    it('should create participant successfully', async () => {
      const mockParticipant = {
        id: 'participant-123',
        event_id: 'event-123',
        name: '田中太郎',
        created_at: '2024-01-01T00:00:00Z',
      }
      
      mockQuery.single.mockResolvedValue({ data: mockParticipant, error: null })
      
      const result = await participantApi.create('event-123', '田中太郎')
      
      expect(mockSupabase.from).toHaveBeenCalledWith('participants')
      expect(mockQuery.insert).toHaveBeenCalledWith({
        event_id: 'event-123',
        name: '田中太郎',
      })
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(mockParticipant)
    })

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Creation failed')
      mockQuery.single.mockResolvedValue({ data: null, error: mockError })
      
      await expect(participantApi.create('event-123', '田中太郎')).rejects.toThrow('Creation failed')
    })
  })

  describe('getByEventId', () => {
    it('should fetch participants for an event', async () => {
      const mockParticipants = [
        {
          id: 'participant-1',
          event_id: 'event-123',
          name: '田中太郎',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'participant-2',
          event_id: 'event-123',
          name: '佐藤花子',
          created_at: '2024-01-01T01:00:00Z',
        },
      ]
      
      mockQuery.order.mockResolvedValue({ data: mockParticipants, error: null })
      
      const result = await participantApi.getByEventId('event-123')
      
      expect(mockSupabase.from).toHaveBeenCalledWith('participants')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('event_id', 'event-123')
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: true })
      expect(result).toEqual(mockParticipants)
    })

    it('should return empty array when no participants found', async () => {
      mockQuery.order.mockResolvedValue({ data: null, error: null })
      
      const result = await participantApi.getByEventId('event-123')
      
      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockError = new Error('Query failed')
      mockQuery.order.mockResolvedValue({ data: null, error: mockError })
      
      await expect(participantApi.getByEventId('event-123')).rejects.toThrow('Query failed')
    })
  })

  describe('update', () => {
    it('should update participant name successfully', async () => {
      const mockUpdatedParticipant = {
        id: 'participant-123',
        event_id: 'event-123',
        name: '田中次郎',
        created_at: '2024-01-01T00:00:00Z',
      }
      
      mockQuery.single.mockResolvedValue({ data: mockUpdatedParticipant, error: null })
      
      const result = await participantApi.update('participant-123', '田中次郎')
      
      expect(mockSupabase.from).toHaveBeenCalledWith('participants')
      expect(mockQuery.update).toHaveBeenCalledWith({ name: '田中次郎' })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'participant-123')
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(mockUpdatedParticipant)
    })

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed')
      mockQuery.single.mockResolvedValue({ data: null, error: mockError })
      
      await expect(participantApi.update('participant-123', 'New Name')).rejects.toThrow('Update failed')
    })
  })

  describe('delete', () => {
    it('should delete participant successfully', async () => {
      // Mock the delete chain properly
      const mockDeleteQuery = { eq: jest.fn() }
      mockQuery.delete.mockReturnValue(mockDeleteQuery)
      mockDeleteQuery.eq.mockResolvedValue({ error: null })
      
      await participantApi.delete('participant-123')
      
      expect(mockSupabase.from).toHaveBeenCalledWith('participants')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockDeleteQuery.eq).toHaveBeenCalledWith('id', 'participant-123')
    })

    it('should throw error when deletion fails', async () => {
      const mockError = new Error('Deletion failed')
      const mockDeleteQuery = { eq: jest.fn() }
      mockQuery.delete.mockReturnValue(mockDeleteQuery)
      mockDeleteQuery.eq.mockResolvedValue({ error: mockError })
      
      await expect(participantApi.delete('participant-123')).rejects.toThrow('Deletion failed')
    })
  })

  describe('subscribe', () => {
    it('should set up real-time subscription for event participants', () => {
      const mockCallback = jest.fn()
      const mockSubscription = { unsubscribe: jest.fn() }
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnValue(mockSubscription),
      }
      
      mockSupabase.channel.mockReturnValue(mockChannel)
      
      const result = participantApi.subscribe('event-123', mockCallback)
      
      expect(mockSupabase.channel).toHaveBeenCalledWith('participants:event-123')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: 'event_id=eq.event-123',
        },
        mockCallback
      )
      expect(mockChannel.subscribe).toHaveBeenCalled()
      expect(result).toBe(mockSubscription)
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockQuery.order.mockRejectedValue(new Error('Network error'))
      
      await expect(participantApi.getByEventId('event-123')).rejects.toThrow('Network error')
    })

    it('should handle malformed responses', async () => {
      mockQuery.single.mockResolvedValue({ data: undefined, error: null })
      
      const result = await participantApi.update('participant-123', 'New Name')
      
      expect(result).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should handle special characters in names', async () => {
      const specialName = 'Name with "quotes" & symbols'
      const mockParticipant = {
        id: 'participant-123',
        event_id: 'event-123',
        name: specialName,
      }
      
      mockQuery.single.mockResolvedValue({ data: mockParticipant, error: null })
      
      const result = await participantApi.create('event-123', specialName)
      
      expect(mockQuery.insert).toHaveBeenCalledWith({
        event_id: 'event-123',
        name: specialName,
      })
      expect(result).toEqual(mockParticipant)
    })

    it('should handle empty participants array', async () => {
      mockQuery.order.mockResolvedValue({ data: [], error: null })
      
      const result = await participantApi.getByEventId('event-123')
      
      expect(result).toEqual([])
    })

    it('should handle Unicode names correctly', async () => {
      const unicodeName = '田中太郎 🇯🇵 émilie'
      const mockParticipant = {
        id: 'participant-123',
        name: unicodeName,
      }
      
      mockQuery.single.mockResolvedValue({ data: mockParticipant, error: null })
      
      const result = await participantApi.create('event-123', unicodeName)
      
      expect(result.name).toBe(unicodeName)
    })
  })
})