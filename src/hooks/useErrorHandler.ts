import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'

interface ErrorState {
  message: string | null
  code?: string
  details?: unknown
}

export const useErrorHandler = () => {
  const [error, setError] = useState<ErrorState>({ message: null })
  const [isError, setIsError] = useState(false)

  const handleError = useCallback((error: unknown, userMessage?: string) => {
    logger.error('Error occurred:', error)
    
    let errorMessage = userMessage || 'エラーが発生しました'
    
    if (error instanceof Error) {
      errorMessage = userMessage || error.message
    } else if (typeof error === 'string') {
      errorMessage = userMessage || error
    }
    
    setError({
      message: errorMessage,
      details: error
    })
    setIsError(true)
    
    // Toast通知でエラーを表示
    toast.error(errorMessage, {
      duration: 5000,
      action: {
        label: '閉じる',
        onClick: () => toast.dismiss(),
      },
    })
  }, [])

  const clearError = useCallback(() => {
    setError({ message: null })
    setIsError(false)
  }, [])

  return { error, isError, handleError, clearError }
}