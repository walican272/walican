/**
 * 支払いリンクの検証ユーティリティ
 */

/**
 * PayPayリンクの検証
 * @param url 検証するURL
 * @returns 検証結果とエラーメッセージ
 */
export function validatePayPayLink(url: string): { isValid: boolean; error?: string } {
  if (!url) {
    return { isValid: false, error: 'URLを入力してください' }
  }

  // PayPayの公式ドメインかチェック
  const validDomains = [
    'https://pay.paypay.ne.jp/',
    'https://paypay.ne.jp/'
  ]
  
  const isValidDomain = validDomains.some(domain => url.startsWith(domain))
  
  if (!isValidDomain) {
    return { 
      isValid: false, 
      error: 'PayPayの公式リンクのみ許可されています (https://pay.paypay.ne.jp/)' 
    }
  }

  // URLの形式をチェック
  try {
    const urlObj = new URL(url)
    
    // 必須のパスパターンをチェック
    if (!urlObj.pathname || urlObj.pathname === '/') {
      return { 
        isValid: false, 
        error: '有効なPayPay送金リンクを入力してください' 
      }
    }
    
    // 危険なパラメータが含まれていないかチェック
    const dangerousParams = ['redirect', 'callback', 'return_url', 'goto']
    for (const param of dangerousParams) {
      if (urlObj.searchParams.has(param)) {
        return { 
          isValid: false, 
          error: 'セキュリティ上の理由により、このリンクは使用できません' 
        }
      }
    }
    
    return { isValid: true }
  } catch (error) {
    return { 
      isValid: false, 
      error: '有効なURLを入力してください' 
    }
  }
}

/**
 * URLをサニタイズして安全にする
 * @param url サニタイズするURL
 * @returns サニタイズされたURL
 */
export function sanitizePaymentUrl(url: string): string {
  if (!url) return ''
  
  // XSS攻撃を防ぐため、特殊文字をエスケープ
  const sanitized = url
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    
  return sanitized
}

/**
 * 支払いリンクが安全に開けるかチェック
 * @param url チェックするURL
 * @returns 安全に開けるかどうか
 */
export function canSafelyOpenPaymentLink(url: string): boolean {
  const validation = validatePayPayLink(url)
  if (!validation.isValid) return false
  
  // 追加のセキュリティチェック
  const sanitized = sanitizePaymentUrl(url)
  return sanitized === url // サニタイズ前後で変化がないことを確認
}