'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { scanReceipt } from '@/lib/ocr/receipt-scanner'
import type { ExtractedReceiptData } from '@/lib/ocr/receipt-scanner'

interface OcrScannerProps {
  onScanComplete: (data: ExtractedReceiptData) => void
  onClose: () => void
}

export function OcrScanner({ onScanComplete, onClose }: OcrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<ExtractedReceiptData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // プレビュー表示
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // OCR処理
    setIsScanning(true)
    try {
      const result = await scanReceipt(file)
      setScanResult(result)
    } catch (error) {
      console.error('OCR Error:', error)
      alert('レシートの読み取りに失敗しました')
    } finally {
      setIsScanning(false)
    }
  }

  const handleConfirm = () => {
    if (scanResult) {
      onScanComplete(scanResult)
      onClose()
    }
  }

  const handleRetry = () => {
    setPreview(null)
    setScanResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>レシートをスキャン</CardTitle>
            <CardDescription>
              レシートの写真から自動で情報を読み取ります
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!preview ? (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 flex-col gap-2"
                variant="outline"
              >
                <Camera className="h-8 w-8" />
                <span>写真を撮る</span>
              </Button>
              
              <Button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.capture = ''
                    fileInputRef.current.click()
                  }
                }}
                className="w-full h-32 flex-col gap-2"
                variant="outline"
              >
                <Upload className="h-8 w-8" />
                <span>ファイルを選択</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* プレビュー画像 */}
              <div className="relative rounded-lg overflow-hidden border">
                <img 
                  src={preview} 
                  alt="Receipt preview" 
                  className="w-full h-auto max-h-96 object-contain bg-gray-50"
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>スキャン中...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* スキャン結果 */}
              {scanResult && !isScanning && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">読み取り結果</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {scanResult.totalAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">合計金額</span>
                        <span className="font-bold text-lg">
                          ¥{scanResult.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {scanResult.date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">日付</span>
                        <span>{scanResult.date}</span>
                      </div>
                    )}
                    
                    {scanResult.items && scanResult.items.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">商品 ({scanResult.items.length}点)</p>
                        <div className="space-y-1 max-h-32 overflow-auto">
                          {scanResult.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="truncate flex-1">{item.name}</span>
                              <span className="ml-2">¥{item.price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {!scanResult.totalAmount && (!scanResult.items || scanResult.items.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        情報を読み取れませんでした。手動で入力してください。
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* アクションボタン */}
              {!isScanning && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRetry}
                    className="flex-1"
                  >
                    もう一度撮影
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="flex-1"
                    disabled={!scanResult || !scanResult.totalAmount}
                  >
                    この内容で入力
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}