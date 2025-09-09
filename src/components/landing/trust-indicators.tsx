'use client'

import React from 'react'
import { Shield, CreditCard, Users, Clock, Lock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrustIndicator {
  icon: React.ReactNode
  text: string
  highlight?: boolean
  description?: string
}

const indicators: TrustIndicator[] = [
  {
    icon: <Lock className="h-5 w-5" />,
    text: 'URLを知る人だけアクセス可能',
    highlight: true,
    description: '共有されたURLを持つ人のみがイベントにアクセスできます',
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    text: 'クレジットカード不要',
    description: '支払い情報の登録は一切不要です',
  },
  {
    icon: <Clock className="h-5 w-5" />,
    text: '60秒で作成完了',
    description: 'たった3ステップで割り勘イベントを作成',
  },
  {
    icon: <Users className="h-5 w-5" />,
    text: '10,000件以上の利用実績',
    description: '多くのユーザーに信頼されています',
  },
  {
    icon: <Shield className="h-5 w-5" />,
    text: '個人情報保護',
    description: 'メールアドレス不要で利用可能',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    text: 'リアルタイム同期',
    description: '参加者全員で同時に確認・編集可能',
  },
]

interface TrustIndicatorsProps {
  variant?: 'compact' | 'detailed' | 'inline'
  maxItems?: number
  className?: string
}

export const TrustIndicators: React.FC<TrustIndicatorsProps> = ({
  variant = 'compact',
  maxItems = 4,
  className,
}) => {
  const displayIndicators = indicators.slice(0, maxItems)

  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap gap-4 justify-center', className)}>
        {displayIndicators.map((indicator, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-2 text-sm',
              indicator.highlight && 'text-primary font-medium'
            )}
          >
            <span className="text-muted-foreground">{indicator.icon}</span>
            <span>{indicator.text}</span>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
        {displayIndicators.map((indicator, index) => (
          <div
            key={index}
            className={cn(
              'flex gap-3 p-4 rounded-lg border bg-card',
              indicator.highlight && 'border-primary/50 bg-primary/5'
            )}
          >
            <div className="shrink-0 text-primary">{indicator.icon}</div>
            <div className="space-y-1">
              <p className="font-medium text-sm">{indicator.text}</p>
              {indicator.description && (
                <p className="text-xs text-muted-foreground">
                  {indicator.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Compact variant (default)
  return (
    <div className={cn('space-y-3', className)}>
      {displayIndicators.map((indicator, index) => (
        <div
          key={index}
          className={cn(
            'flex items-center gap-3 text-sm',
            indicator.highlight && 'text-primary font-medium'
          )}
        >
          <span className="text-muted-foreground">{indicator.icon}</span>
          <span>{indicator.text}</span>
        </div>
      ))}
    </div>
  )
}

// モバイル向けの簡潔版
export const MobileTrustBadge: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
      <Shield className="h-4 w-4" />
      <span>安全・無料・簡単</span>
    </div>
  )
}