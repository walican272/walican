import { renderHook, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

// Mock external dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

describe('useAuth', () => {
  const mockPush = jest.fn()
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      
      const { result } = renderHook(() => useAuth())
      
      expect(result.current.isLoading).toBe(true)
      expect(result.current.user).toBe(null)
    })

    it('should check authentication on mount', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1)
      expect(result.current.user).toEqual(mockUser)
    })
  })

  describe('checkAuth', () => {
    it('should return user when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      const user = await result.current.checkAuth()
      expect(user).toEqual(mockUser)
      expect(result.current.user).toEqual(mockUser)
    })

    it('should return null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      const user = await result.current.checkAuth()
      expect(user).toBe(null)
      expect(result.current.user).toBe(null)
    })

    it('should handle auth check errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Auth error'))
      
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      const user = await result.current.checkAuth()
      expect(user).toBe(null)
      expect(result.current.user).toBe(null)
      expect(consoleError).toHaveBeenCalledWith('Auth check failed:', expect.any(Error))
      
      consoleError.mockRestore()
    })

    it('should always set loading to false after check', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Auth error'))
      jest.spyOn(console, 'error').mockImplementation()
      
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      // Should be false even after error
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('logout', () => {
    it('should sign out and redirect to home', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({})
      
      const { result } = renderHook(() => useAuth())
      
      await result.current.logout()
      
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('should handle logout errors gracefully', async () => {
      mockSupabase.auth.signOut.mockRejectedValue(new Error('Logout error'))
      
      const { result } = renderHook(() => useAuth())
      
      // Should not throw
      await expect(result.current.logout()).resolves.toBeUndefined()
      
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  describe('callback dependencies', () => {
    it('should maintain stable callback references', () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      
      const { result, rerender } = renderHook(() => useAuth())
      
      const firstCheckAuth = result.current.checkAuth
      const firstLogout = result.current.logout
      
      rerender()
      
      const secondCheckAuth = result.current.checkAuth
      const secondLogout = result.current.logout
      
      expect(firstCheckAuth).toBe(secondCheckAuth)
      expect(firstLogout).toBe(secondLogout)
    })
  })

  describe('edge cases', () => {
    it('should handle undefined user data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: undefined })
      
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.user).toBe(null)
    })

    it('should handle null response data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: null })
      
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.user).toBe(null)
    })

    it('should handle empty response', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({})
      
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.user).toBe(null)
    })
  })
})