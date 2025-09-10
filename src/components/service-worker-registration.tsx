'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // 開発環境ではService Workerを無効化
      if (process.env.NODE_ENV === 'development') {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach(registration => {
            registration.unregister()
            logger.log('Service Worker unregistered in development')
          })
        })
        return
      }

      // 本番環境でのみService Workerを登録
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            logger.log('Service Worker registered:', registration)
            
            // 更新があれば即座に適用
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' })
            }
            
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    logger.log('New service worker available')
                  }
                })
              }
            })
          })
          .catch((error) => {
            logger.error('Service Worker registration failed:', error)
          })
      })
    }
  }, [])

  return null
}