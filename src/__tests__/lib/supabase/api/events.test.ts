import { eventApi } from '@/lib/supabase/api/events'
import { createClient } from '@/lib/supabase/client'
import { nanoid } from 'nanoid'

// Mock external dependencies
jest.mock('@/lib/supabase/client')
jest.mock('nanoid')

describe('eventApi', () => {
  const mockSupabase = {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
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
    ;(nanoid as jest.Mock).mockReturnValue('test-url-123')
    
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

  describe('getByUserId', () => {
    it('should fetch events for a specific user', async () => {
      const mockEvents = [
        { id: '1', name: 'Event 1', user_id: 'user-123' },
        { id: '2', name: 'Event 2', user_id: 'user-123' },
      ]
      
      mockQuery.order.mockResolvedValue({ data: mockEvents, error: null })
      
      const result = await eventApi.getByUserId('user-123')
      
      expect(mockSupabase.from).toHaveBeenCalledWith('events')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockEvents)
    })

    it('should throw error when query fails', async () => {
      const mockError = new Error('Database error')
      mockQuery.order.mockResolvedValue({ data: null, error: mockError })
      
      await expect(eventApi.getByUserId('user-123')).rejects.toThrow('Database error')
    })

    it('should handle empty results', async () => {
      mockQuery.order.mockResolvedValue({ data: [], error: null })
      
      const result = await eventApi.getByUserId('user-123')
      
      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    const mockEventData = {
      name: 'Test Event',
      description: 'Test Description',
      date: '2024-01-15',
    }

    it('should create event with authenticated user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockCreatedEvent = { 
        id: 'event-123', 
        ...mockEventData, 
        unique_url: 'test-url-123',
        user_id: 'user-123' 
      }
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockQuery.single.mockResolvedValue({ data: mockCreatedEvent, error: null })
      
      const result = await eventApi.create(mockEventData)
      
      expect(nanoid).toHaveBeenCalledWith(10)
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      expect(mockSupabase.from).toHaveBeenCalledWith('events')
      expect(mockQuery.insert).toHaveBeenCalledWith({
        ...mockEventData,
        unique_url: 'test-url-123',
        user_id: 'user-123',
      })
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(mockCreatedEvent)
    })

    it('should create event with provided user_id', async () => {
      const eventDataWithUserId = { ...mockEventData, user_id: 'custom-user' }
      const mockCreatedEvent = { 
        id: 'event-123', 
        ...eventDataWithUserId, 
        unique_url: 'test-url-123' 
      }
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      mockQuery.single.mockResolvedValue({ data: mockCreatedEvent, error: null })
      
      const result = await eventApi.create(eventDataWithUserId)
      
      expect(mockQuery.insert).toHaveBeenCalledWith({
        ...eventDataWithUserId,
        unique_url: 'test-url-123',
        user_id: 'custom-user',
      })
      expect(result).toEqual(mockCreatedEvent)
    })

    it('should create event with null user_id when no user', async () => {
      const mockCreatedEvent = { 
        id: 'event-123', 
        ...mockEventData, 
        unique_url: 'test-url-123',
        user_id: null 
      }
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      mockQuery.single.mockResolvedValue({ data: mockCreatedEvent, error: null })
      
      const result = await eventApi.create(mockEventData)
      
      expect(mockQuery.insert).toHaveBeenCalledWith({
        ...mockEventData,
        unique_url: 'test-url-123',
        user_id: null,
      })
      expect(result).toEqual(mockCreatedEvent)
    })

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Creation failed')
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      mockQuery.single.mockResolvedValue({ data: null, error: mockError })
      
      await expect(eventApi.create(mockEventData)).rejects.toThrow('Creation failed')
    })

    it('should generate unique URL for each event', async () => {
      ;(nanoid as jest.Mock)
        .mockReturnValueOnce('unique-1')
        .mockReturnValueOnce('unique-2')
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      mockQuery.single.mockResolvedValue({ data: {}, error: null })
      
      await eventApi.create(mockEventData)
      await eventApi.create(mockEventData)
      
      expect(nanoid).toHaveBeenCalledTimes(2)
      expect(mockQuery.insert).toHaveBeenNthCalledWith(1, expect.objectContaining({
        unique_url: 'unique-1',
      }))
      expect(mockQuery.insert).toHaveBeenNthCalledWith(2, expect.objectContaining({
        unique_url: 'unique-2',
      }))
    })
  })

  describe('getByUrl', () => {
    it('should fetch event by unique URL', async () => {
      const mockEvent = { 
        id: 'event-123', 
        name: 'Test Event', 
        unique_url: 'test-url' 
      }
      
      mockQuery.single.mockResolvedValue({ data: mockEvent, error: null })
      
      const result = await eventApi.getByUrl('test-url')
      
      expect(mockSupabase.from).toHaveBeenCalledWith('events')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('unique_url', 'test-url')
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(mockEvent)
    })

    it('should throw error when event not found', async () => {
      const mockError = new Error('Event not found')
      mockQuery.single.mockResolvedValue({ data: null, error: mockError })
      
      await expect(eventApi.getByUrl('non-existent')).rejects.toThrow('Event not found')
    })
  })

  describe('update', () => {
    it('should update event successfully', async () => {
      const updateData = { name: 'Updated Event', description: 'Updated Description' }
      const mockUpdatedEvent = { 
        id: 'event-123', 
        ...updateData,
        unique_url: 'test-url' 
      }
      
      mockQuery.single.mockResolvedValue({ data: mockUpdatedEvent, error: null })
      
      const result = await eventApi.update('event-123', updateData)
      
      expect(mockSupabase.from).toHaveBeenCalledWith('events')
      expect(mockQuery.update).toHaveBeenCalledWith(updateData)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'event-123')
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(mockUpdatedEvent)
    })

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed')
      mockQuery.single.mockResolvedValue({ data: null, error: mockError })
      
      await expect(eventApi.update('event-123', {})).rejects.toThrow('Update failed')
    })

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'New Name Only' }
      const mockUpdatedEvent = { 
        id: 'event-123',
        name: 'New Name Only',
        description: 'Original Description',
        unique_url: 'test-url'
      }
      
      mockQuery.single.mockResolvedValue({ data: mockUpdatedEvent, error: null })
      
      const result = await eventApi.update('event-123', partialUpdate)
      
      expect(mockQuery.update).toHaveBeenCalledWith(partialUpdate)
      expect(result).toEqual(mockUpdatedEvent)
    })
  })

  describe('delete', () => {
    it('should delete event successfully', async () => {
      mockQuery.delete.mockResolvedValue({ error: null })
      
      await eventApi.delete('event-123')
      
      expect(mockSupabase.from).toHaveBeenCalledWith('events')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'event-123')
    })

    it('should throw error when deletion fails', async () => {
      const mockError = new Error('Deletion failed')
      mockQuery.delete.mockResolvedValue({ error: mockError })
      
      await expect(eventApi.delete('event-123')).rejects.toThrow('Deletion failed')
    })
  })

  describe('subscribe', () => {
    it('should set up real-time subscription', () => {
      const mockCallback = jest.fn()
      const mockSubscription = { unsubscribe: jest.fn() }
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnValue(mockSubscription),
      }
      
      mockSupabase.channel.mockReturnValue(mockChannel)
      
      const result = eventApi.subscribe('event-123', mockCallback)
      
      expect(mockSupabase.channel).toHaveBeenCalledWith('event:event-123')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: 'id=eq.event-123',
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
      
      eventApi.subscribe('different-event', mockCallback)
      
      expect(mockSupabase.channel).toHaveBeenCalledWith('event:different-event')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          filter: 'id=eq.different-event',
        }),
        mockCallback
      )
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockQuery.order.mockRejectedValue(new Error('Network error'))
      
      await expect(eventApi.getByUserId('user-123')).rejects.toThrow('Network error')
    })

    it('should handle authentication errors in create', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Auth error'))
      
      await expect(eventApi.create({})).rejects.toThrow('Auth error')
    })

    it('should handle malformed responses', async () => {
      mockQuery.single.mockResolvedValue({ data: undefined, error: null })
      
      const result = await eventApi.getByUrl('test-url')
      
      expect(result).toBeUndefined()
    })
  })
})