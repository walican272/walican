'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StepProgress } from '@/components/ui/progress'
import { EventNameStep } from '@/components/quick-create/event-name-step'
import { ParticipantCountStep } from '@/components/quick-create/participant-count-step'
import { CompletionStep } from '@/components/quick-create/completion-step'
import { ArrowLeft, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { nanoid } from 'nanoid'

interface QuickCreateState {
  currentStep: 1 | 2 | 3
  eventName: string
  participantCount: number
  generatedUrl: string
  isCreating: boolean
}

export default function QuickCreatePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [state, setState] = useState<QuickCreateState>({
    currentStep: 1,
    eventName: '',
    participantCount: 4,
    generatedUrl: '',
    isCreating: false,
  })

  const handleNextStep = async () => {
    if (state.currentStep === 2) {
      // ステップ2から3へ移動する際にイベントを作成
      await createQuickEvent()
    } else if (state.currentStep < 3) {
      setState(prev => ({
        ...prev,
        currentStep: (prev.currentStep + 1) as 1 | 2 | 3
      }))
    }
  }

  const handleBackStep = () => {
    if (state.currentStep > 1) {
      setState(prev => ({
        ...prev,
        currentStep: (prev.currentStep - 1) as 1 | 2 | 3
      }))
    }
  }

  const createQuickEvent = async () => {
    setState(prev => ({ ...prev, isCreating: true }))
    
    try {
      const uniqueUrl = nanoid(10)
      
      // イベントを作成
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          name: state.eventName,
          unique_url: uniqueUrl,
          description: `${state.participantCount}人で割り勘`,
          is_quick_mode: true,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日後に期限切れ
        })
        .select()
        .single()

      if (eventError) {
        console.error('Event creation error:', eventError)
        throw eventError
      }

      // デフォルトの参加者を作成
      const participants = []
      for (let i = 1; i <= state.participantCount; i++) {
        participants.push({
          event_id: event.id,
          name: `参加者${i}`,
        })
      }

      const { error: participantsError } = await supabase
        .from('participants')
        .insert(participants)

      if (participantsError) {
        console.error('Participants creation error:', participantsError)
        throw participantsError
      }

      setState(prev => ({
        ...prev,
        generatedUrl: uniqueUrl,
        currentStep: 3,
        isCreating: false,
      }))
      
      toast.success('イベントを作成しました！')
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('イベントの作成に失敗しました')
      setState(prev => ({ ...prev, isCreating: false }))
    }
  }

  const handleContinueToEvent = () => {
    router.push(`/events/${state.generatedUrl}`)
  }

  const handleExit = () => {
    if (state.currentStep === 3 || confirm('作成を中止しますか？')) {
      router.push('/')
    }
  }

  const stepLabels = ['イベント名', '参加人数', '完了']

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-transparent">
      {/* ヘッダー */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {state.currentStep > 1 && state.currentStep < 3 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackStep}
                  disabled={state.isCreating}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-lg font-semibold">かんたん作成</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExit}
              disabled={state.isCreating}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* プログレスバー */}
      <div className="container mx-auto px-4 py-6">
        <StepProgress
          currentStep={state.currentStep}
          totalSteps={3}
          labels={stepLabels}
          className="max-w-md mx-auto"
        />
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-8">
        {state.currentStep === 1 && (
          <EventNameStep
            value={state.eventName}
            onChange={(value) => setState(prev => ({ ...prev, eventName: value }))}
            onNext={handleNextStep}
          />
        )}

        {state.currentStep === 2 && (
          <ParticipantCountStep
            value={state.participantCount}
            onChange={(value) => setState(prev => ({ ...prev, participantCount: value }))}
            onNext={handleNextStep}
            onBack={handleBackStep}
          />
        )}

        {state.currentStep === 3 && (
          <CompletionStep
            eventName={state.eventName}
            participantCount={state.participantCount}
            eventUrl={state.generatedUrl}
            onContinue={handleContinueToEvent}
          />
        )}
      </div>

      {/* フッター */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t md:hidden">
        <div className="text-center text-xs text-muted-foreground">
          <Link href="/" className="underline">
            通常の作成モードに切り替え
          </Link>
        </div>
      </div>
    </div>
  )
}