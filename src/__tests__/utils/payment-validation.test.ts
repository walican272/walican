import { validatePayPayLink, sanitizePaymentUrl, canSafelyOpenPaymentLink } from '@/lib/utils/payment-validation'

describe('PayPay Link Validation', () => {
  describe('validatePayPayLink', () => {
    it('should accept valid PayPay URLs', () => {
      const validUrls = [
        'https://pay.paypay.ne.jp/abc123',
        'https://pay.paypay.ne.jp/link/xyz789',
        'https://paypay.ne.jp/payment/abc',
      ]

      validUrls.forEach(url => {
        const result = validatePayPayLink(url)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'http://pay.paypay.ne.jp/abc', // httpは許可しない
        'https://fake-paypay.com/link', // 偽のドメイン
        'https://pay.paypay.ne.jp/', // パスがない
        'https://example.com/paypay', // 完全に異なるドメイン
        'javascript:alert(1)', // XSS攻撃
        '', // 空文字
      ]

      invalidUrls.forEach(url => {
        const result = validatePayPayLink(url)
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })

    it('should reject URLs with dangerous parameters', () => {
      const dangerousUrls = [
        'https://pay.paypay.ne.jp/link?redirect=http://evil.com',
        'https://pay.paypay.ne.jp/link?callback=javascript:alert(1)',
        'https://pay.paypay.ne.jp/link?return_url=http://phishing.com',
      ]

      dangerousUrls.forEach(url => {
        const result = validatePayPayLink(url)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('セキュリティ')
      })
    })
  })

  describe('sanitizePaymentUrl', () => {
    it('should remove dangerous patterns', () => {
      const tests = [
        {
          input: 'https://pay.paypay.ne.jp/<script>alert(1)</script>',
          expected: 'https://pay.paypay.ne.jp/scriptalert(1)/script'
        },
        {
          input: 'javascript:alert(1)',
          expected: 'alert(1)'
        },
        {
          input: 'data:text/html,<script>alert(1)</script>',
          expected: 'text/html,scriptalert(1)/script'
        },
      ]

      tests.forEach(({ input, expected }) => {
        expect(sanitizePaymentUrl(input)).toBe(expected)
      })
    })

    it('should not modify safe URLs', () => {
      const safeUrl = 'https://pay.paypay.ne.jp/link/abc123'
      expect(sanitizePaymentUrl(safeUrl)).toBe(safeUrl)
    })
  })

  describe('canSafelyOpenPaymentLink', () => {
    it('should return true for valid and safe URLs', () => {
      const safeUrls = [
        'https://pay.paypay.ne.jp/link/abc123',
        'https://paypay.ne.jp/payment/xyz',
      ]

      safeUrls.forEach(url => {
        expect(canSafelyOpenPaymentLink(url)).toBe(true)
      })
    })

    it('should return false for invalid or unsafe URLs', () => {
      const unsafeUrls = [
        'https://fake-paypay.com/link',
        'javascript:alert(1)',
        'https://pay.paypay.ne.jp/<script>',
        '',
      ]

      unsafeUrls.forEach(url => {
        expect(canSafelyOpenPaymentLink(url)).toBe(false)
      })
    })
  })
})