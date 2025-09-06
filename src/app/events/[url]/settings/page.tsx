'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ParticipantModal } from '@/components/event/participant-modal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Users,
  Calendar,
  MapPin,
  Globe,
  Trash2,
  Plus,
  Edit2,
  Save,
  X,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { participantApi } from '@/lib/supabase/api/participants'
import type { Event, Participant } from '@/types'

export default function EventSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const eventUrl = params.url as string
  const supabase = createClient()

  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    currency: 'JPY'
  })

  useEffect(() => {
    loadEventData()
  }, [eventUrl])

  const loadEventData = async () => {
    setIsLoading(true)
    try {
      // イベント情報を取得
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('unique_url', eventUrl)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)
      
      // 編集フォームに初期値を設定
      setEditForm({
        name: eventData.name || '',
        description: eventData.description || '',
        date: eventData.date ? new Date(eventData.date).toISOString().slice(0, 16) : '',
        location: eventData.location || '',
        currency: eventData.currency || 'JPY'
      })

      // 参加者を取得
      const participantsData = await participantApi.getByEventId(eventData.id)
      setParticipants(participantsData)
    } catch (error) {
      console.error('Error loading event data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateEvent = async () => {
    if (!event) return

    try {
      const { error } = await supabase
        .from('events')
        .update({
          name: editForm.name,
          description: editForm.description,
          date: editForm.date || null,
          location: editForm.location,
          currency: editForm.currency
        })
        .eq('id', event.id)

      if (error) throw error

      setEvent({
        ...event,
        name: editForm.name,
        description: editForm.description,
        date: editForm.date || null,
        location: editForm.location,
        currency: editForm.currency
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating event:', error)
    }
  }

  const handleDeleteParticipant = async (participantId: string) => {
    if (!confirm('この参加者を削除してもよろしいですか？')) return

    try {
      await participantApi.delete(participantId)
      setParticipants(participants.filter(p => p.id !== participantId))
    } catch (error) {
      console.error('Error deleting participant:', error)
    }
  }

  const handleDeleteEvent = async () => {
    if (!event) return
    if (!confirm('このイベントを完全に削除してもよろしいですか？この操作は取り消せません。')) return

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id)

      if (error) throw error
      
      router.push('/')
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  if (isLoading) {
    return (
      <>
        <Header title="設定" />
        <main className="container mx-auto p-4">
          <p className="text-center text-muted-foreground">読み込み中...</p>
        </main>
      </>
    )
  }

  if (!event) {
    return (
      <>
        <Header title="設定" />
        <main className="container mx-auto p-4">
          <p className="text-center text-muted-foreground">イベントが見つかりません</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Header 
        title={
          <div className="flex items-center gap-2">
            <Link href={`/events/${eventUrl}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <span>イベント設定</span>
          </div>
        }
      />

      <main className="container mx-auto p-4 pb-20">
        <div className="space-y-4">
          {/* イベント情報 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">イベント情報</CardTitle>
              {!isEditing ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="mr-1 h-4 w-4" />
                  編集
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleUpdateEvent}
                  >
                    <Save className="mr-1 h-4 w-4" />
                    保存
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setEditForm({
                        name: event.name,
                        description: event.description || '',
                        date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
                        location: event.location || '',
                        currency: event.currency || 'JPY'
                      })
                    }}
                  >
                    <X className="mr-1 h-4 w-4" />
                    キャンセル
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEditing ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">イベント名</p>
                    <p className="font-medium">{event.name}</p>
                  </div>
                  {event.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">説明</p>
                      <p>{event.description}</p>
                    </div>
                  )}
                  {event.date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(event.date).toLocaleString('ja-JP')}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>通貨: {event.currency || 'JPY'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">イベント名</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">説明</Label>
                    <Textarea
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">日時</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">場所</Label>
                    <Input
                      id="location"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="例: 東京駅"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">通貨</Label>
                    <select
                      id="currency"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={editForm.currency}
                      onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                    >
                      <option value="JPY">JPY (¥)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CNY">CNY (¥)</option>
                      <option value="KRW">KRW (₩)</option>
                    </select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 参加者管理 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                <Users className="mr-2 inline h-5 w-5" />
                参加者 ({participants.length}人)
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setIsParticipantModalOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                追加
              </Button>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  まだ参加者がいません
                </p>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => {
                    // 支払いがある参加者は削除できない
                    const hasExpenses = false // TODO: 実際の支払いチェック
                    return (
                      <div key={participant.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{participant.name}</p>
                          {participant.email && (
                            <p className="text-sm text-muted-foreground">{participant.email}</p>
                          )}
                        </div>
                        {!hasExpenses && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteParticipant(participant.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 危険な操作 */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">
                <AlertCircle className="mr-2 inline h-5 w-5" />
                危険な操作
              </CardTitle>
              <CardDescription>
                以下の操作は取り消すことができません
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDeleteEvent}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                イベントを削除
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav eventUrl={eventUrl} />

      <ParticipantModal
        eventId={event?.id || ''}
        isOpen={isParticipantModalOpen}
        onClose={() => setIsParticipantModalOpen(false)}
        onSuccess={() => loadEventData()}
      />
    </>
  )
}