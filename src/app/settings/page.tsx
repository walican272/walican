'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { toast } from 'sonner'
import { 
  Moon, 
  Sun, 
  Monitor,
  Globe,
  Download,
  Trash2,
  Info,
  ArrowLeft,
  Wallet,
  Settings,
  AlertCircle
} from 'lucide-react'
// import { validatePayPayLink } from '@/lib/utils/payment-validation'

// PayPayリンクの検証（一時的にインライン実装）
function validatePayPayLink(url: string): { isValid: boolean; error?: string } {
  if (!url) {
    return { isValid: false, error: 'URLを入力してください' }
  }
  
  const validDomains = ['https://pay.paypay.ne.jp/', 'https://paypay.ne.jp/']
  const isValidDomain = validDomains.some(domain => url.startsWith(domain))
  
  if (!isValidDomain) {
    return { 
      isValid: false, 
      error: 'PayPayの公式リンクのみ許可されています' 
    }
  }
  
  return { isValid: true }
}
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface UserProfile {
  id?: string
  email?: string
  display_name?: string
  paypay_link?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currency, setCurrency] = useState('JPY')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({})
  const [payPayLinkError, setPayPayLinkError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const savedCurrency = localStorage.getItem('defaultCurrency') || 'JPY'
    setCurrency(savedCurrency)
    loadUserSettings()
  }, [])

  const loadUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        // プロファイルを取得
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileData) {
          setProfile(profileData)
        } else {
          setProfile({
            id: user.id,
            email: user.email
          })
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!user) {
      toast.error('ログインが必要です')
      return
    }
    
    // PayPayリンクの検証
    if (profile.paypay_link) {
      const validation = validatePayPayLink(profile.paypay_link)
      if (!validation.isValid) {
        setPayPayLinkError(validation.error || '無効なURLです')
        toast.error(validation.error || '無効なURLです')
        return
      }
    }
    
    setSaving(true)
    try {
      const profileData = {
        id: user.id,
        email: user.email,
        display_name: profile.display_name,
        paypay_link: profile.paypay_link,
        updated_at: new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('profiles')
        .upsert(profileData)
      
      if (error) throw error
      
      toast.success('プロフィールを保存しました')
      setPayPayLinkError(null)
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('プロフィールの保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }
  
  const handlePayPayLinkChange = (value: string) => {
    setProfile({ ...profile, paypay_link: value })
    
    // リアルタイムバリデーション
    if (value) {
      const validation = validatePayPayLink(value)
      setPayPayLinkError(validation.isValid ? null : validation.error || null)
    } else {
      setPayPayLinkError(null)
    }
  }

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
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-2" />
              一般
            </TabsTrigger>
            <TabsTrigger value="payment">
              <Wallet className="h-4 w-4 mr-2" />
              支払い
            </TabsTrigger>
            <TabsTrigger value="data">
              <Info className="h-4 w-4 mr-2" />
              データ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            {/* PayPay設定 */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Wallet className="mr-2 inline h-5 w-5" />
                  PayPay設定
                </CardTitle>
                <CardDescription>
                  精算時に表示される送金リンクを設定します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="display_name">表示名</Label>
                      <Input
                        id="display_name"
                        value={profile.display_name || ''}
                        onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                        placeholder="表示する名前を入力"
                      />
                      <p className="text-xs text-muted-foreground">
                        精算時に表示される名前です
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="paypay_link">PayPay送金リンク</Label>
                      <div className="relative">
                        <Input
                          id="paypay_link"
                          value={profile.paypay_link || ''}
                          onChange={(e) => handlePayPayLinkChange(e.target.value)}
                          placeholder="https://pay.paypay.ne.jp/..."
                          className={payPayLinkError ? 'border-red-500' : ''}
                        />
                        {payPayLinkError && (
                          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                        )}
                      </div>
                      {payPayLinkError ? (
                        <p className="text-xs text-red-500">{payPayLinkError}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          PayPayアプリから「送金リンクを作成」で取得したURLを入力してください
                        </p>
                      )}
                    </div>
                    
                    <Button onClick={saveProfile} disabled={saving} className="w-full">
                      {saving ? '保存中...' : '支払い設定を保存'}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      PayPay設定を利用するにはログインが必要です
                    </p>
                    <Link href="/auth/login">
                      <Button>
                        ログインする
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
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
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </>
  )
}