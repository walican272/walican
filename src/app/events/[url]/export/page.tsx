'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { participantApi } from '@/lib/supabase/api/participants'
import { expenseApi } from '@/lib/supabase/api/expenses'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Download, Copy, FileText, FileJson, Table } from 'lucide-react'
import Link from 'next/link'
import { calculateBalances, calculateSettlements } from '@/lib/utils/settlement'
import type { Event, Participant, Expense } from '@/types'

export default function ExportPage() {
  const params = useParams()
  const router = useRouter()
  const eventUrl = params.url as string
  const supabase = createClient()
  
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [exportFormat, setExportFormat] = useState<'text' | 'json' | 'csv'>('text')
  const [exportData, setExportData] = useState('')

  useEffect(() => {
    if (eventUrl) {
      loadEventData()
    }
  }, [eventUrl])

  const loadEventData = async () => {
    setIsLoading(true)
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('unique_url', eventUrl)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      const [participantsData, expensesData] = await Promise.all([
        participantApi.getByEventId(eventData.id),
        expenseApi.getByEventId(eventData.id)
      ])

      setParticipants(participantsData)
      setExpenses(expensesData)
      
      // 最後に開いたイベントとして保存
      localStorage.setItem('lastEventUrl', eventUrl)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (event && participants.length > 0) {
      generateExportData()
    }
  }, [event, participants, expenses, exportFormat])

  const generateExportData = () => {
    const balances = calculateBalances(participants, expenses)
    const settlements = calculateSettlements(balances)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

    switch (exportFormat) {
      case 'json':
        setExportData(JSON.stringify({
          event: {
            name: event?.name,
            date: event?.date,
            location: event?.location,
            description: event?.description,
            url: `${window.location.origin}/events/${eventUrl}`
          },
          summary: {
            totalExpenses,
            participantCount: participants.length,
            perPerson: Math.round(totalExpenses / participants.length)
          },
          participants: participants.map(p => p.name),
          expenses: expenses.map(e => ({
            paidBy: participants.find(p => p.id === e.paid_by)?.name,
            amount: e.amount,
            category: e.category,
            description: e.description,
            date: e.created_at
          })),
          settlements: settlements.map(s => ({
            from: s.from.name,
            to: s.to.name,
            amount: s.amount
          }))
        }, null, 2))
        break

      case 'csv':
        const csvHeaders = ['タイプ', '支払者/送金元', '受取人/送金先', '金額', 'カテゴリ', '説明', '日時']
        const csvRows = [
          csvHeaders.join(','),
          ...expenses.map(e => [
            '支払い',
            participants.find(p => p.id === e.paid_by)?.name || '',
            '',
            e.amount,
            e.category,
            e.description || '',
            new Date(e.created_at).toLocaleString('ja-JP')
          ].join(',')),
          ...settlements.map(s => [
            '精算',
            s.from.name,
            s.to.name,
            s.amount,
            '',
            '精算',
            ''
          ].join(','))
        ]
        setExportData(csvRows.join('\n'))
        break

      case 'text':
      default:
        const text = `
========================================
Walican 割り勘レポート
========================================

イベント: ${event?.name}
日時: ${event?.date ? new Date(event.date).toLocaleString('ja-JP') : '未設定'}
場所: ${event?.location || '未設定'}
URL: ${window.location.origin}/events/${eventUrl}

========================================
サマリー
========================================
合計金額: ¥${totalExpenses.toLocaleString()}
参加人数: ${participants.length}人
1人あたり: ¥${Math.round(totalExpenses / participants.length).toLocaleString()}

========================================
参加者
========================================
${participants.map(p => `・${p.name}`).join('\n')}

========================================
支払い履歴
========================================
${expenses.map(e => {
  const payer = participants.find(p => p.id === e.paid_by)
  return `${new Date(e.created_at).toLocaleString('ja-JP')}
  ${payer?.name} が ¥${e.amount.toLocaleString()} を支払い
  カテゴリ: ${e.category}
  ${e.description ? `説明: ${e.description}` : ''}`
}).join('\n---\n')}

========================================
精算
========================================
${settlements.length === 0 ? '精算の必要はありません' : 
settlements.map(s => `${s.from.name} → ${s.to.name}: ¥${s.amount.toLocaleString()}`).join('\n')}

========================================
作成日時: ${new Date().toLocaleString('ja-JP')}
`
        setExportData(text.trim())
        break
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportData)
      alert('クリップボードにコピーしました')
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const handleDownload = () => {
    const extension = exportFormat === 'json' ? 'json' : exportFormat === 'csv' ? 'csv' : 'txt'
    const mimeType = exportFormat === 'json' ? 'application/json' : 
                     exportFormat === 'csv' ? 'text/csv' : 'text/plain'
    
    const blob = new Blob([exportData], { type: `${mimeType};charset=utf-8;` })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `walican_${event?.name}_${new Date().toISOString().split('T')[0]}.${extension}`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <>
      <Header 
        title="データエクスポート"
        action={
          <Link href={`/events/${eventUrl}`}>
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
              <CardTitle>{event.name}</CardTitle>
              <CardDescription>イベントデータをエクスポート</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* フォーマット選択 */}
                <div>
                  <Label className="mb-2 block text-sm font-medium">エクスポート形式</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={exportFormat === 'text' ? 'default' : 'outline'}
                      onClick={() => setExportFormat('text')}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <FileText className="h-5 w-5" />
                      <span className="text-xs">テキスト</span>
                    </Button>
                    <Button
                      variant={exportFormat === 'json' ? 'default' : 'outline'}
                      onClick={() => setExportFormat('json')}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <FileJson className="h-5 w-5" />
                      <span className="text-xs">JSON</span>
                    </Button>
                    <Button
                      variant={exportFormat === 'csv' ? 'default' : 'outline'}
                      onClick={() => setExportFormat('csv')}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <Table className="h-5 w-5" />
                      <span className="text-xs">CSV</span>
                    </Button>
                  </div>
                </div>

                {/* プレビュー */}
                <div>
                  <Label className="mb-2 block text-sm font-medium">プレビュー</Label>
                  <div className="max-h-96 overflow-auto rounded-lg border bg-muted p-4">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {exportData}
                    </pre>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="flex-1"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    コピー
                  </Button>
                  <Button
                    onClick={handleDownload}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    ダウンロード
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}