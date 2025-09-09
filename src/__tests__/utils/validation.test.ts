import {
  sanitizeString,
  validateEventName,
  validateAmount,
  validateParticipantName,
  validateDescription,
  validateUrlParam,
  validateEmail,
  validateDate,
  validateCustomSplits
} from '@/lib/utils/validation'

describe('Validation Utils', () => {
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeString('<script>alert("XSS")</script>')).toBe('alert(&quot;XSS&quot;)')
      expect(sanitizeString('<div>Hello</div>')).toBe('Hello')
    })

    it('should escape dangerous characters', () => {
      // Test characters that are escaped after HTML tag removal
      const result = sanitizeString('Test & " \' /')
      expect(result).toContain('&amp;')
      expect(result).toContain('&quot;')
      expect(result).toContain('&#x27;')
      expect(result).toContain('&#x2F;')
      expect(result).toBe('Test &amp; &quot; &#x27; &#x2F;')
    })

    it('should handle angle brackets by removing them as HTML tags', () => {
      // < > are removed as HTML tags, not escaped
      const result = sanitizeString('Test <invalid> content')
      expect(result).toBe('Test  content')
    })

    it('should handle empty input', () => {
      expect(sanitizeString('')).toBe('')
    })
  })

  describe('validateEventName', () => {
    it('should validate valid event names', () => {
      expect(validateEventName('沖縄旅行').isValid).toBe(true)
      expect(validateEventName('忘年会2024').isValid).toBe(true)
    })

    it('should reject empty names', () => {
      const result = validateEventName('')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('入力してください')
    })

    it('should reject names over 100 characters', () => {
      const longName = 'a'.repeat(101)
      const result = validateEventName(longName)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('100文字以内')
    })

    it('should reject SQL injection attempts', () => {
      const result = validateEventName('Event; DROP TABLE events;')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('使用できない文字')
    })
  })

  describe('validateAmount', () => {
    it('should validate valid amounts', () => {
      expect(validateAmount(1000).isValid).toBe(true)
      expect(validateAmount('5000').isValid).toBe(true)
      expect(validateAmount(0).isValid).toBe(true)
    })

    it('should reject negative amounts', () => {
      const result = validateAmount(-100)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('0以上')
    })

    it('should reject amounts over 10 million', () => {
      const result = validateAmount(10000001)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('1000万円以下')
    })

    it('should reject invalid numbers', () => {
      const result = validateAmount('abc')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('有効な金額')
    })
  })

  describe('validateParticipantName', () => {
    it('should validate valid names', () => {
      expect(validateParticipantName('田中太郎').isValid).toBe(true)
      expect(validateParticipantName('Alice').isValid).toBe(true)
    })

    it('should reject empty names', () => {
      const result = validateParticipantName('')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('入力してください')
    })

    it('should reject names with special characters', () => {
      const result = validateParticipantName('<script>')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('使用できない文字')
    })

    it('should reject names over 50 characters', () => {
      const longName = 'a'.repeat(51)
      const result = validateParticipantName(longName)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('50文字以内')
    })
  })

  describe('validateDescription', () => {
    it('should validate valid descriptions', () => {
      expect(validateDescription('楽しい旅行でした').isValid).toBe(true)
      expect(validateDescription('').isValid).toBe(true) // 空も許可
    })

    it('should reject descriptions over 500 characters', () => {
      const longDesc = 'a'.repeat(501)
      const result = validateDescription(longDesc)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('500文字以内')
    })
  })

  describe('validateUrlParam', () => {
    it('should validate valid URL parameters', () => {
      expect(validateUrlParam('abc123').isValid).toBe(true)
      expect(validateUrlParam('event_2024').isValid).toBe(true)
      expect(validateUrlParam('test-param').isValid).toBe(true)
    })

    it('should reject empty parameters', () => {
      const result = validateUrlParam('')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('無効なURL')
    })

    it('should reject special characters', () => {
      const result = validateUrlParam('../../etc/passwd')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('無効なURLパラメータ')
    })

    it('should reject parameters over 50 characters', () => {
      const longParam = 'a'.repeat(51)
      const result = validateUrlParam(longParam)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('長すぎます')
    })
  })

  describe('validateEmail', () => {
    it('should validate valid emails', () => {
      expect(validateEmail('test@example.com').isValid).toBe(true)
      expect(validateEmail('user.name@company.co.jp').isValid).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(validateEmail('notanemail').isValid).toBe(false)
      expect(validateEmail('@example.com').isValid).toBe(false)
      expect(validateEmail('test@').isValid).toBe(false)
    })

    it('should reject empty email', () => {
      const result = validateEmail('')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('入力してください')
    })
  })

  describe('validateDate', () => {
    it('should validate valid dates', () => {
      expect(validateDate('2024-01-01').isValid).toBe(true)
      expect(validateDate('2024-12-31T23:59:59').isValid).toBe(true)
      expect(validateDate('').isValid).toBe(true) // 空も許可
    })

    it('should reject invalid dates', () => {
      const result = validateDate('not-a-date')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('有効な日付')
    })

    it('should reject extreme dates', () => {
      expect(validateDate('1899-12-31').isValid).toBe(false)
      expect(validateDate('2101-01-01').isValid).toBe(false)
    })
  })

  describe('validateCustomSplits', () => {
    it('should validate valid splits', () => {
      const splits = { '1': 1000, '2': 2000, '3': 1000 }
      expect(validateCustomSplits(splits, 4000).isValid).toBe(true)
    })

    it('should reject empty splits', () => {
      const result = validateCustomSplits({}, 1000)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('分割情報が不正')
    })

    it('should reject negative amounts', () => {
      const splits = { '1': 1000, '2': -500 }
      const result = validateCustomSplits(splits, 500)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('0以上')
    })

    it('should reject mismatched totals', () => {
      const splits = { '1': 1000, '2': 2000 }
      const result = validateCustomSplits(splits, 5000)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('一致しません')
    })
  })
})