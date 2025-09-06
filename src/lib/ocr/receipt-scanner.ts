import Tesseract from 'tesseract.js'

export interface ExtractedReceiptData {
  totalAmount?: number
  items?: Array<{
    name: string
    price: number
  }>
  date?: string
  storeName?: string
}

export async function scanReceipt(imageFile: File): Promise<ExtractedReceiptData> {
  try {
    // 画像をbase64に変換
    const imageUrl = await fileToDataUrl(imageFile)
    
    // OCR実行
    const result = await Tesseract.recognize(
      imageUrl,
      'jpn+eng', // 日本語と英語
      {
        logger: (m) => console.log('OCR Progress:', m),
      }
    )
    
    const text = result.data.text
    console.log('OCR Result:', text)
    
    // テキストから情報を抽出
    return extractReceiptInfo(text)
  } catch (error) {
    console.error('OCR Error:', error)
    throw new Error('レシートの読み取りに失敗しました')
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function extractReceiptInfo(text: string): ExtractedReceiptData {
  const lines = text.split('\n').filter(line => line.trim())
  const data: ExtractedReceiptData = {
    items: []
  }
  
  // 合計金額を探す（様々なパターンに対応）
  const totalPatterns = [
    /合計[\s:：]*[¥￥]?\s*([0-9,]+)/,
    /計[\s:：]*[¥￥]?\s*([0-9,]+)/,
    /TOTAL[\s:：]*[¥￥]?\s*([0-9,]+)/i,
    /支払[\s:：]*[¥￥]?\s*([0-9,]+)/,
    /[¥￥]\s*([0-9,]+)\s*$/
  ]
  
  for (const line of lines) {
    // 合計金額の抽出
    for (const pattern of totalPatterns) {
      const match = line.match(pattern)
      if (match && !data.totalAmount) {
        const amount = parseInt(match[1].replace(/,/g, ''))
        if (amount > 0 && amount < 10000000) { // 妥当な金額範囲
          data.totalAmount = amount
        }
      }
    }
    
    // 商品と価格の抽出（簡易版）
    const itemPattern = /(.+?)\s+[¥￥]?\s*([0-9,]+)$/
    const itemMatch = line.match(itemPattern)
    if (itemMatch) {
      const name = itemMatch[1].trim()
      const price = parseInt(itemMatch[2].replace(/,/g, ''))
      
      // 商品名として妥当そうなものだけ追加
      if (name.length > 1 && name.length < 50 && price > 0 && price < 100000) {
        data.items?.push({ name, price })
      }
    }
    
    // 日付の抽出
    const datePatterns = [
      /(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})日?/,
      /(\d{1,2})[月\/](\d{1,2})日?/
    ]
    
    for (const pattern of datePatterns) {
      const dateMatch = line.match(pattern)
      if (dateMatch && !data.date) {
        if (dateMatch[3]) {
          data.date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`
        } else {
          const year = new Date().getFullYear()
          data.date = `${year}-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`
        }
      }
    }
  }
  
  // 合計金額がなく、商品がある場合は合計を計算
  if (!data.totalAmount && data.items && data.items.length > 0) {
    data.totalAmount = data.items.reduce((sum, item) => sum + item.price, 0)
  }
  
  return data
}