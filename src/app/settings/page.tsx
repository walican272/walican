'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { toast } from 'sonner'
import { 
  ArrowLeft,
  Wallet
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface UserProfile {
  id?: string
  email?: string
  display_name?: string
  paypay_link?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({})

  useEffect(() => {
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
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('プロフィールの保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

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
                    <Input
                      id="paypay_link"
                      value={profile.paypay_link || ''}
                      onChange={(e) => setProfile({ ...profile, paypay_link: e.target.value })}
                      placeholder="https://pay.paypay.ne.jp/..."
                    />
                    <p className="text-xs text-muted-foreground">
                      PayPayアプリから「送金リンクを作成」で取得したURLを入力してください
                    </p>
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
        </div>
      </main>

      <BottomNav />
    </>
  )
}