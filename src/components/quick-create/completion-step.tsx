'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Copy, 
  Check, 
  Share2, 
  MessageCircle, 
  Users,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

interface CompletionStepProps {
  eventName: string
  participantCount: number
  eventUrl: string
  onContinue: () => void
  className?: string
}

export const CompletionStep: React.FC<CompletionStepProps> = ({
  eventName,
  participantCount,
  eventUrl,
  onContinue,
  className,
}) => {
  const [copied, setCopied] = useState(false)
  const fullUrl = `${window.location.origin}/events/${eventUrl}`

  useEffect(() => {
    // 完了時にコンフェッティアニメーション
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast.success('URLをコピーしました！')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('コピーに失敗しました')
    }
  }

  const handleShare = async (platform: 'line' | 'general') => {
    const text = `「${eventName}」の割り勘をWalicanで管理しましょう！\n参加はこちらから👇`
    
    if (platform === 'line') {
      const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text + '\n' + fullUrl)}`
      window.open(lineUrl, '_blank')
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: `${eventName} - Walican`,
          text: text,
          url: fullUrl,
        })
      } catch (error) {
        // ユーザーがキャンセルした場合は何もしない
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      <div className="space-y-6">
        {/* 成功メッセージ */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold">準備完了！</h2>
          <p className="text-muted-foreground">
            「{eventName}」の割り勘イベントを作成しました
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{participantCount}人で割り勘</span>
          </div>
        </div>

        {/* URL表示とコピー */}
        <Card className="p-4 border-primary/20 bg-primary/5">
          <div className="space-y-3">
            <p className="text-sm font-medium">共有URL</p>
            <div className="flex gap-2">
              <Input
                value={fullUrl}
                readOnly
                className="text-xs bg-background"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* 共有オプション */}
        <div className="space-y-3">
          <p className="text-sm text-center text-muted-foreground">
            参加者にURLを共有しましょう
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleShare('line')}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-5 w-5 text-green-600" />
              LINE
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleShare('general')}
              className="flex items-center gap-2"
            >
              <Share2 className="h-5 w-5" />
              共有
            </Button>
          </div>
        </div>

        {/* 次のアクション */}
        <Button
          size="lg"
          className="w-full"
          onClick={onContinue}
        >
          イベントページへ
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        {/* 追加情報 */}
        <div className="text-center space-y-2 text-xs text-muted-foreground">
          <p>💡 URLを知っている人だけがアクセスできます</p>
          <p>📅 データは30日間保存されます</p>
        </div>
      </div>
    </div>
  )
}

