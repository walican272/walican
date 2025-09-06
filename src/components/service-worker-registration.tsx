'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // 開発環境ではService Workerを無効化
      if (process.env.NODE_ENV === 'development') {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach(registration => {
            registration.unregister()
            console.log('Service Worker unregistered in development')
          })
        })
        return
      }

      // 本番環境でのみService Workerを登録
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration)
            
            // 更新があれば即座に適用
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' })
            }
            
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('New service worker available')
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error)
          })
      })
    }
  }, [])

  return null
}