'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, ArrowLeft } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>メールを確認してください</CardTitle>
          <CardDescription>
            登録いただいたメールアドレスに確認メールを送信しました
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="mb-2">次のステップ：</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>メールボックスを確認</li>
              <li>確認メール内のリンクをクリック</li>
              <li>アカウントの有効化が完了</li>
            </ol>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            メールが届かない場合は、迷惑メールフォルダをご確認ください
          </p>

          <div className="space-y-2">
            <Link href="/auth/login" className="block">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                ログインページへ戻る
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}