'use client'

import React, { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserCheck, 
  UserMinus,
  Calculator,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/currency'

interface Participant {
  id: string
  name: string
  user_id?: string | null
}

interface ParticipantSelectorProps {
  participants: Participant[]
  selectedParticipants: string[]
  onSelectionChange: (selected: string[]) => void
  customAmounts?: Record<string, number>
  onCustomAmountChange?: (participantId: string, amount: number) => void
  totalAmount: number
  splitType: 'equal' | 'custom' | 'percentage'
  onSplitTypeChange?: (type: 'equal' | 'custom' | 'percentage') => void
  className?: string
}

export const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({
  participants,
  selectedParticipants,
  onSelectionChange,
  customAmounts = {},
  onCustomAmountChange,
  totalAmount,
  splitType = 'equal',
  onSplitTypeChange,
  className,
}) => {
  const [selectAll, setSelectAll] = useState(false)
  const [percentages, setPercentages] = useState<Record<string, number>>({})

  useEffect(() => {
    // 全員選択状態をチェック
    setSelectAll(
      participants.length > 0 && 
      selectedParticipants.length === participants.length
    )
  }, [selectedParticipants, participants])

  const handleSelectAll = () => {
    if (selectAll) {
      onSelectionChange([])
    } else {
      onSelectionChange(participants.map(p => p.id))
    }
  }

  const handleToggleParticipant = (participantId: string) => {
    if (selectedParticipants.includes(participantId)) {
      onSelectionChange(selectedParticipants.filter(id => id !== participantId))
    } else {
      onSelectionChange([...selectedParticipants, participantId])
    }
  }

  const calculateEqualSplit = () => {
    if (selectedParticipants.length === 0) return 0
    return Math.round(totalAmount / selectedParticipants.length)
  }

  const calculatePercentageSplit = (participantId: string) => {
    const percentage = percentages[participantId] || 0
    return Math.round((totalAmount * percentage) / 100)
  }

  const handlePercentageChange = (participantId: string, value: string) => {
    const percentage = parseFloat(value) || 0
    setPercentages(prev => ({
      ...prev,
      [participantId]: Math.min(100, Math.max(0, percentage))
    }))
    
    if (onCustomAmountChange) {
      onCustomAmountChange(participantId, calculatePercentageSplit(participantId))
    }
  }

  const getTotalPercentage = () => {
    return selectedParticipants.reduce((sum, id) => {
      return sum + (percentages[id] || 0)
    }, 0)
  }

  const getParticipantAmount = (participantId: string) => {
    if (!selectedParticipants.includes(participantId)) return 0
    
    switch (splitType) {
      case 'equal':
        return calculateEqualSplit()
      case 'custom':
        return customAmounts[participantId] || 0
      case 'percentage':
        return calculatePercentageSplit(participantId)
      default:
        return 0
    }
  }

  const getTotalSplit = () => {
    return selectedParticipants.reduce((sum, id) => {
      return sum + getParticipantAmount(id)
    }, 0)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          誰の分を支払いましたか？
        </Label>
        <Badge variant="secondary">
          {selectedParticipants.length}/{participants.length}人選択
        </Badge>
      </div>

      {/* 分割方法選択 */}
      {onSplitTypeChange && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={splitType === 'equal' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSplitTypeChange('equal')}
          >
            <Users className="h-4 w-4 mr-1" />
            均等割
          </Button>
          <Button
            type="button"
            variant={splitType === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSplitTypeChange('custom')}
          >
            <Calculator className="h-4 w-4 mr-1" />
            個別金額
          </Button>
          <Button
            type="button"
            variant={splitType === 'percentage' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSplitTypeChange('percentage')}
          >
            <DollarSign className="h-4 w-4 mr-1" />
            割合指定
          </Button>
        </div>
      )}

      {/* 全選択/全解除 */}
      <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
        <Checkbox
          id="select-all"
          checked={selectAll}
          onCheckedChange={handleSelectAll}
        />
        <Label
          htmlFor="select-all"
          className="text-sm font-medium cursor-pointer flex-1"
        >
          全員を選択
        </Label>
        {splitType === 'equal' && selectedParticipants.length > 0 && (
          <span className="text-sm text-muted-foreground">
            1人あたり {formatCurrency(calculateEqualSplit())}
          </span>
        )}
      </div>

      {/* 参加者リスト */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {participants.map((participant) => {
          const isSelected = selectedParticipants.includes(participant.id)
          const amount = getParticipantAmount(participant.id)
          
          return (
            <div
              key={participant.id}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                isSelected ? "bg-primary/5 border-primary/20" : "bg-background"
              )}
            >
              <Checkbox
                id={participant.id}
                checked={isSelected}
                onCheckedChange={() => handleToggleParticipant(participant.id)}
              />
              
              <Label
                htmlFor={participant.id}
                className="flex-1 cursor-pointer flex items-center gap-2"
              >
                {participant.user_id ? (
                  <UserCheck className="h-4 w-4 text-primary" />
                ) : (
                  <UserMinus className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium">{participant.name}</span>
              </Label>

              {isSelected && (
                <div className="flex items-center gap-2">
                  {splitType === 'custom' && onCustomAmountChange && (
                    <Input
                      type="number"
                      value={customAmounts[participant.id] || ''}
                      onChange={(e) => onCustomAmountChange(participant.id, parseFloat(e.target.value) || 0)}
                      placeholder="金額"
                      className="w-24 h-8 text-sm"
                    />
                  )}
                  
                  {splitType === 'percentage' && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={percentages[participant.id] || ''}
                        onChange={(e) => handlePercentageChange(participant.id, e.target.value)}
                        placeholder="0"
                        min="0"
                        max="100"
                        className="w-16 h-8 text-sm"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  )}
                  
                  <Badge variant="secondary" className="min-w-[80px] justify-center">
                    {formatCurrency(amount)}
                  </Badge>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 合計表示 */}
      {selectedParticipants.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>支払い総額:</span>
            <span className="font-medium">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>分割合計:</span>
            <span className={cn(
              "font-medium",
              getTotalSplit() === totalAmount ? "text-green-600" : "text-orange-600"
            )}>
              {formatCurrency(getTotalSplit())}
            </span>
          </div>
          
          {splitType === 'percentage' && (
            <div className="flex justify-between text-sm">
              <span>合計割合:</span>
              <span className={cn(
                "font-medium",
                getTotalPercentage() === 100 ? "text-green-600" : "text-orange-600"
              )}>
                {getTotalPercentage()}%
              </span>
            </div>
          )}
          
          {getTotalSplit() !== totalAmount && (
            <p className="text-xs text-orange-600">
              ⚠️ 分割合計が支払い総額と一致しません
            </p>
          )}
        </div>
      )}
    </div>
  )
}