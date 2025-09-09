/**
 * 入力検証ユーティリティ
 * SQLインジェクション、XSS攻撃を防ぐための検証関数
 */

/**
 * 文字列の基本的なサニタイズ
 * HTMLタグやスクリプトを除去
 */
export function sanitizeString(input: string): string {
  if (!input) return ''
  
  // HTMLタグを除去
  const withoutTags = input.replace(/<[^>]*>/g, '')
  
  // 危険な文字をエスケープ
  return withoutTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * イベント名の検証
 */
export function validateEventName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'イベント名を入力してください' }
  }
  
  if (name.length > 100) {
    return { isValid: false, error: 'イベント名は100文字以内で入力してください' }
  }
  
  // SQLインジェクションのリスクがある文字列をチェック
  const sqlPatterns = /(\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE)\b|;|--)/i
  if (sqlPatterns.test(name)) {
    return { isValid: false, error: '使用できない文字が含まれています' }
  }
  
  return { isValid: true }
}

/**
 * 金額の検証
 */
export function validateAmount(amount: number | string): { isValid: boolean; error?: string } {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: '有効な金額を入力してください' }
  }
  
  if (numAmount < 0) {
    return { isValid: false, error: '金額は0以上で入力してください' }
  }
  
  if (numAmount > 10000000) {
    return { isValid: false, error: '金額が大きすぎます（1000万円以下）' }
  }
  
  return { isValid: true }
}

/**
 * 参加者名の検証
 */
export function validateParticipantName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: '参加者名を入力してください' }
  }
  
  if (name.length > 50) {
    return { isValid: false, error: '参加者名は50文字以内で入力してください' }
  }
  
  // 特殊文字のチェック（名前に必要ない文字）
  const invalidChars = /[<>\"'`]/
  if (invalidChars.test(name)) {
    return { isValid: false, error: '使用できない文字が含まれています' }
  }
  
  return { isValid: true }
}

/**
 * 説明文の検証
 */
export function validateDescription(desc: string): { isValid: boolean; error?: string } {
  if (desc && desc.length > 500) {
    return { isValid: false, error: '説明は500文字以内で入力してください' }
  }
  
  return { isValid: true }
}

/**
 * URLパラメータの検証（unique_url）
 */
export function validateUrlParam(param: string): { isValid: boolean; error?: string } {
  if (!param) {
    return { isValid: false, error: '無効なURLです' }
  }
  
  // 英数字とハイフン、アンダースコアのみ許可
  const validPattern = /^[a-zA-Z0-9_-]+$/
  if (!validPattern.test(param)) {
    return { isValid: false, error: '無効なURLパラメータです' }
  }
  
  if (param.length > 50) {
    return { isValid: false, error: 'URLパラメータが長すぎます' }
  }
  
  return { isValid: true }
}

/**
 * メールアドレスの検証
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email) {
    return { isValid: false, error: 'メールアドレスを入力してください' }
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) {
    return { isValid: false, error: '有効なメールアドレスを入力してください' }
  }
  
  if (email.length > 100) {
    return { isValid: false, error: 'メールアドレスが長すぎます' }
  }
  
  return { isValid: true }
}

/**
 * 日付の検証
 */
export function validateDate(date: string): { isValid: boolean; error?: string } {
  if (!date) {
    return { isValid: true } // 日付は任意
  }
  
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: '有効な日付を入力してください' }
  }
  
  // 極端な日付をチェック（1900年〜2100年）
  const year = dateObj.getFullYear()
  if (year < 1900 || year > 2100) {
    return { isValid: false, error: '日付の範囲が不正です' }
  }
  
  return { isValid: true }
}

/**
 * カスタム分割の検証
 */
export function validateCustomSplits(
  splits: Record<string, number>,
  totalAmount: number
): { isValid: boolean; error?: string } {
  const splitValues = Object.values(splits)
  
  if (splitValues.length === 0) {
    return { isValid: false, error: '分割情報が不正です' }
  }
  
  // 各金額が正の数かチェック
  if (splitValues.some(v => v < 0)) {
    return { isValid: false, error: '分割金額は0以上で入力してください' }
  }
  
  // 合計が元の金額と一致するかチェック（誤差許容）
  const sum = splitValues.reduce((acc, val) => acc + val, 0)
  if (Math.abs(sum - totalAmount) > 0.01) {
    return { isValid: false, error: '分割金額の合計が支払い金額と一致しません' }
  }
  
  return { isValid: true }
}

/**
 * UUIDの検証
 */
export function validateUUID(uuid: string): { isValid: boolean; error?: string } {
  if (!uuid) {
    return { isValid: false, error: '無効なIDです' }
  }
  
  // UUID v4のパターン
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(uuid)) {
    return { isValid: false, error: '無効なID形式です' }
  }
  
  return { isValid: true }
}

/**
 * 金額の定数定義
 */
export const AMOUNT_LIMITS = {
  MAX_AMOUNT: 10000000, // 1000万円
  MIN_AMOUNT: 0,
  PRECISION: 0.01, // 最小精度
} as const