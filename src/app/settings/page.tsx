'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { 
  Moon, 
  Sun, 
  Monitor,
  Globe,
  Download,
  Trash2,
  Info,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currency, setCurrency] = useState('JPY')

  useEffect(() => {
    setMounted(true)
    const savedCurrency = localStorage.getItem('defaultCurrency') || 'JPY'
    setCurrency(savedCurrency)
  }, [])

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency)
    localStorage.setItem('defaultCurrency', newCurrency)
  }

  const handleClearData = () => {
    if (confirm('すべてのローカルデータを削除しますか？この操作は取り消せません。')) {
      localStorage.clear()
      router.push('/')
    }
  }

  const handleExportData = () => {
    const eventUrl = localStorage.getItem('lastEventUrl')
    if (eventUrl) {
      router.push(`/events/${eventUrl}/export`)
    } else {
      alert('エクスポートするイベントがありません')
    }
  }

  if (!mounted) return null

  const themes = [
    { value: 'light', label: 'ライト', icon: Sun },
    { value: 'dark', label: 'ダーク', icon: Moon },
    { value: 'system', label: 'システム', icon: Monitor },
  ]

  const currencies = [
    { value: 'JPY', label: '日本円 (¥)', symbol: '¥' },
    { value: 'USD', label: '米ドル ($)', symbol: '$' },
    { value: 'EUR', label: 'ユーロ (€)', symbol: '€' },
    { value: 'GBP', label: '英ポンド (£)', symbol: '£' },
    { value: 'CNY', label: '人民元 (¥)', symbol: '¥' },
    { value: 'KRW', label: 'ウォン (₩)', symbol: '₩' },
  ]

  return (
    <>
      <Header 
        title="設定"
        action={
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        }
      />

      <main className="container mx-auto p-4 pb-20">
        <div className="space-y-4">
          {/* テーマ設定 */}
          <Card>
            <CardHeader>
              <CardTitle>テーマ</CardTitle>
              <CardDescription>アプリの外観を選択</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {themes.map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={theme === value ? 'default' : 'outline'}
                    onClick={() => setTheme(value)}
                    className="flex flex-col gap-2 h-auto py-3"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 通貨設定 */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Globe className="mr-2 inline h-5 w-5" />
                デフォルト通貨
              </CardTitle>
              <CardDescription>新規イベントで使用する通貨</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currencies.map(({ value, label, symbol }) => (
                  <label
                    key={value}
                    className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="currency"
                        value={value}
                        checked={currency === value}
                        onChange={() => handleCurrencyChange(value)}
                        className="h-4 w-4"
                      />
                      <span>{label}</span>
                    </div>
                    <span className="text-lg font-bold text-muted-foreground">{symbol}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* データ管理 */}
          <Card>
            <CardHeader>
              <CardTitle>データ管理</CardTitle>
              <CardDescription>データのエクスポートやクリア</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleExportData}
              >
                <Download className="mr-2 h-4 w-4" />
                イベントデータをエクスポート
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleClearData}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                すべてのローカルデータを削除
              </Button>
            </CardContent>
          </Card>

          {/* アプリ情報 */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Info className="mr-2 inline h-5 w-5" />
                アプリ情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">バージョン</span>
                  <span>1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PWA対応</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">オフライン対応</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">リアルタイム同期</span>
                  <span className="text-green-600">✓</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 開発者情報 */}
          <Card>
            <CardHeader>
              <CardTitle>開発者</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Walican - かんたん割り勘ツール
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                © 2024 Walican. All rights reserved.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </>
  )
}