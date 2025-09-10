/**
 * 環境に応じたロガーユーティリティ
 * 開発環境ではconsoleに出力、本番環境では無効化
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  
  error: (...args: any[]) => {
    // エラーは本番環境でも記録（将来的にSentryなどに送信）
    if (isDevelopment || isTest) {
      console.error(...args)
    } else {
      // 本番環境では将来的にエラー追跡サービスに送信
      // TODO: Sentry.captureException(args[0])
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },
  
  table: (data: any) => {
    if (isDevelopment) {
      console.table(data)
    }
  },
  
  time: (label: string) => {
    if (isDevelopment) {
      console.time(label)
    }
  },
  
  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label)
    }
  }
}

export default logger