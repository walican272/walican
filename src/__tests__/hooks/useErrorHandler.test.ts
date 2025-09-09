import { renderHook, act } from '@testing-library/react'
import { useErrorHandler } from '@/hooks/useErrorHandler'

// Mock alert
const mockAlert = jest.fn()
global.alert = mockAlert

describe('useErrorHandler', () => {
  beforeEach(() => {
    mockAlert.mockClear()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should initialize with no error', () => {
    const { result } = renderHook(() => useErrorHandler())

    expect(result.current.error.message).toBe(null)
    expect(result.current.isError).toBe(false)
  })

  it('should handle error with custom message', () => {
    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.handleError(new Error('Test error'), 'カスタムエラーメッセージ')
    })

    expect(result.current.error.message).toBe('カスタムエラーメッセージ')
    expect(result.current.isError).toBe(true)
    expect(mockAlert).toHaveBeenCalledWith('カスタムエラーメッセージ')
  })

  it('should handle error without custom message', () => {
    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.handleError(new Error('Test error'))
    })

    expect(result.current.error.message).toBe('Test error')
    expect(result.current.isError).toBe(true)
    expect(mockAlert).toHaveBeenCalledWith('Test error')
  })

  it('should handle string error', () => {
    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.handleError('文字列エラー')
    })

    expect(result.current.error.message).toBe('文字列エラー')
    expect(result.current.isError).toBe(true)
    expect(mockAlert).toHaveBeenCalledWith('文字列エラー')
  })

  it('should handle unknown error type', () => {
    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.handleError({ code: 500 })
    })

    expect(result.current.error.message).toBe('エラーが発生しました')
    expect(result.current.isError).toBe(true)
    expect(mockAlert).toHaveBeenCalledWith('エラーが発生しました')
  })

  it('should clear error', () => {
    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.handleError(new Error('Test error'))
    })

    expect(result.current.isError).toBe(true)

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error.message).toBe(null)
    expect(result.current.isError).toBe(false)
  })

  it('should log error to console', () => {
    const { result } = renderHook(() => useErrorHandler())
    const testError = new Error('Test error')

    act(() => {
      result.current.handleError(testError)
    })

    expect(console.error).toHaveBeenCalledWith('Error occurred:', testError)
  })
})