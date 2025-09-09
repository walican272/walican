/**
 * 通貨フォーマットユーティリティ
 */

export const CURRENCY_CONFIG = {
  JPY: { symbol: '¥', locale: 'ja-JP', decimals: 0 },
  USD: { symbol: '$', locale: 'en-US', decimals: 2 },
  EUR: { symbol: '€', locale: 'de-DE', decimals: 2 },
  GBP: { symbol: '£', locale: 'en-GB', decimals: 2 },
  CNY: { symbol: '¥', locale: 'zh-CN', decimals: 2 },
  KRW: { symbol: '₩', locale: 'ko-KR', decimals: 0 },
} as const

export type SupportedCurrency = keyof typeof CURRENCY_CONFIG

/**
 * 金額を通貨形式でフォーマット
 */
export function formatCurrency(amount: number, currency: string = 'JPY'): string {
  const config = CURRENCY_CONFIG[currency as SupportedCurrency] || CURRENCY_CONFIG.JPY
  
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(amount)
  } catch {
    // フォールバック: シンプルな形式
    const formatted = amount.toLocaleString('ja-JP', {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    })
    return `${config.symbol}${formatted}`
  }
}

/**
 * 通貨リストを取得
 */
export function getCurrencyList() {
  return Object.keys(CURRENCY_CONFIG).map(code => ({
    code,
    symbol: CURRENCY_CONFIG[code as SupportedCurrency].symbol,
    name: getCurrencyName(code),
  }))
}

/**
 * 通貨名を取得
 */
export function getCurrencyName(code: string): string {
  const names: Record<string, string> = {
    JPY: '日本円',
    USD: '米ドル',
    EUR: 'ユーロ',
    GBP: '英ポンド',
    CNY: '中国元',
    KRW: '韓国ウォン',
  }
  return names[code] || code
}