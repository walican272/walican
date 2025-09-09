import { toast } from 'sonner'

interface RateLimitStore {
  attempts: number
  firstAttempt: number
  blocked: boolean
}

class RateLimiter {
  private store: Map<string, RateLimitStore> = new Map()
  private readonly maxAttempts: number
  private readonly windowMs: number
  private readonly blockDurationMs: number

  constructor(
    maxAttempts = 5,           // 最大試行回数
    windowMs = 60000,          // 時間窓（1分）
    blockDurationMs = 300000   // ブロック時間（5分）
  ) {
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
    this.blockDurationMs = blockDurationMs
  }

  /**
   * レート制限をチェック
   * @param key 識別キー（IPアドレス、ユーザーID、ブラウザフィンガープリントなど）
   * @returns true: 許可, false: 拒否
   */
  check(key: string): boolean {
    const now = Date.now()
    const record = this.store.get(key)

    // 初回アクセス
    if (!record) {
      this.store.set(key, {
        attempts: 1,
        firstAttempt: now,
        blocked: false
      })
      return true
    }

    // ブロック中
    if (record.blocked) {
      const blockExpiry = record.firstAttempt + this.blockDurationMs
      if (now > blockExpiry) {
        // ブロック解除
        this.store.delete(key)
        return this.check(key)
      }
      const remainingTime = Math.ceil((blockExpiry - now) / 1000)
      toast.error(`しばらくお待ちください（残り${remainingTime}秒）`)
      return false
    }

    // 時間窓をチェック
    if (now - record.firstAttempt > this.windowMs) {
      // 時間窓リセット
      this.store.set(key, {
        attempts: 1,
        firstAttempt: now,
        blocked: false
      })
      return true
    }

    // 試行回数をインクリメント
    record.attempts++

    // 制限を超えた場合
    if (record.attempts > this.maxAttempts) {
      record.blocked = true
      record.firstAttempt = now
      toast.error('リクエストが多すぎます。しばらくお待ちください。')
      return false
    }

    return true
  }

  /**
   * クリーンアップ（古いエントリを削除）
   */
  cleanup() {
    const now = Date.now()
    const maxAge = Math.max(this.windowMs, this.blockDurationMs)
    
    this.store.forEach((record, key) => {
      if (now - record.firstAttempt > maxAge) {
        this.store.delete(key)
      }
    })
  }
}

// ブラウザフィンガープリントを生成
export function getBrowserFingerprint(): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return 'default'
  
  ctx.textBaseline = 'top'
  ctx.font = '14px Arial'
  ctx.fillStyle = '#f60'
  ctx.fillRect(125, 1, 62, 20)
  ctx.fillStyle = '#069'
  ctx.fillText('Browser Fingerprint', 2, 15)
  
  const dataURL = canvas.toDataURL()
  let hash = 0
  for (let i = 0; i < dataURL.length; i++) {
    const char = dataURL.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  return hash.toString()
}

// シングルトンインスタンス
export const quickEventLimiter = new RateLimiter(3, 60000, 300000)  // 1分間に3回まで
export const expenseLimiter = new RateLimiter(10, 60000, 300000)    // 1分間に10回まで

// 定期的なクリーンアップ
if (typeof window !== 'undefined') {
  setInterval(() => {
    quickEventLimiter.cleanup()
    expenseLimiter.cleanup()
  }, 60000) // 1分ごと
}