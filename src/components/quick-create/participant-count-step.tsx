'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft, Plus, Minus, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ParticipantCountStepProps {
  value: number
  onChange: (value: number) => void
  onNext: () => void
  onBack: () => void
  className?: string
}

const quickCounts = [2, 3, 4, 5, 6, 8, 10]

export const ParticipantCountStep: React.FC<ParticipantCountStepProps> = ({
  value,
  onChange,
  onNext,
  onBack,
  className,
}) => {
  const [customMode, setCustomMode] = useState(false)

  const handleIncrement = () => {
    if (value < 50) {
      onChange(value + 1)
    }
  }

  const handleDecrement = () => {
    if (value > 2) {
      onChange(value - 1)
    }
  }

  const handleQuickSelect = (count: number) => {
    onChange(count)
    setTimeout(onNext, 200) // 少し待ってから次へ
  }

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">何人で割り勘しますか？</h2>
          <p className="text-muted-foreground">
            参加人数を選択してください
          </p>
        </div>

        {!customMode ? (
          <>
            {/* クイック選択 */}
            <div className="grid grid-cols-3 gap-3">
              {quickCounts.map((count) => (
                <Button
                  key={count}
                  variant={value === count ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => handleQuickSelect(count)}
                  className="h-20 flex flex-col gap-1"
                >
                  <Users className="h-6 w-6" />
                  <span className="text-xl font-bold">{count}人</span>
                </Button>
              ))}
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setCustomMode(true)}
                className="text-sm"
              >
                その他の人数を入力
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* カスタム入力 */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                disabled={value <= 2}
                className="h-12 w-12"
              >
                <Minus className="h-5 w-5" />
              </Button>

              <div className="text-center">
                <div className="text-4xl font-bold">{value}</div>
                <div className="text-sm text-muted-foreground">人</div>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                disabled={value >= 50}
                className="h-12 w-12"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setCustomMode(false)}
                className="text-sm"
              >
                クイック選択に戻る
              </Button>
            </div>
          </>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onBack}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            戻る
          </Button>
          <Button
            size="lg"
            onClick={onNext}
            disabled={value < 2}
            className="flex-1"
          >
            次へ
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}