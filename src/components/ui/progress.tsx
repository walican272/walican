import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  className?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
          className
        )}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-primary transition-all"
          style={{
            transform: `translateX(-${100 - percentage}%)`,
          }}
        />
      </div>
    )
  }
)
Progress.displayName = 'Progress'

interface StepProgressProps {
  currentStep: number
  totalSteps: number
  labels?: string[]
  className?: string
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  totalSteps,
  labels = [],
  className,
}) => {
  const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100

  return (
    <div className={cn('w-full', className)}>
      {/* ステップラベル */}
      {labels.length > 0 && (
        <div className="mb-4 flex justify-between">
          {labels.map((label, index) => (
            <div
              key={index}
              className={cn(
                'text-xs font-medium transition-colors',
                index + 1 === currentStep
                  ? 'text-primary'
                  : index + 1 < currentStep
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/50'
              )}
            >
              {label}
            </div>
          ))}
        </div>
      )}

      {/* プログレスバー */}
      <div className="relative">
        <Progress value={percentage} max={100} className="h-2" />
        
        {/* ステップインジケーター */}
        <div className="absolute -top-1 flex w-full justify-between">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded-full border-2 bg-background transition-all',
                index + 1 === currentStep
                  ? 'border-primary scale-125'
                  : index + 1 < currentStep
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground'
              )}
            >
              {index + 1 < currentStep && (
                <svg
                  className="h-2 w-2 text-primary-foreground"
                  fill="currentColor"
                  viewBox="0 0 8 8"
                >
                  <path d="M6.41 1L7 1.59L3.29 5.29L1 3L1.59 2.41L3.29 4.12L6.41 1Z" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 現在のステップ表示 */}
      <div className="mt-4 text-center">
        <span className="text-sm text-muted-foreground">
          ステップ {currentStep} / {totalSteps}
        </span>
      </div>
    </div>
  )
}

export { Progress }