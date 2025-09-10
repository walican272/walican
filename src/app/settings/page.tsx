'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)

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
          <Card>
            <CardHeader>
              <CardTitle>設定</CardTitle>
              <CardDescription>
                アプリケーションの設定
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                設定機能は現在メンテナンス中です
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </>
  )
}