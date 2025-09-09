'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EventNameStepProps {
  value: string
  onChange: (value: string) => void
  onNext: () => void
  className?: string
}

const suggestions = [
  '昨日の飲み会',
  '温泉旅行',
  'BBQパーティー',
  'カラオケ',
  '新年会',
  '歓迎会',
]

export const EventNameStep: React.FC<EventNameStepProps> = ({
  value,
  onChange,
  onNext,
  className,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onNext()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    setTimeout(onNext, 300) // 少し待ってから次へ
  }

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">何の割り勘ですか？</h2>
          <p className="text-muted-foreground">
            イベント名を入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value)
                setShowSuggestions(false)
              }}
              placeholder="例: 昨日の飲み会"
              className="text-lg py-6 px-4"
              autoFocus
              required
            />
            {value && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              </div>
            )}
          </div>

          {showSuggestions && !value && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">よく使われる例：</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!value.trim()}
          >
            次へ
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}