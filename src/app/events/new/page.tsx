'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function NewEventPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return

    setIsLoading(true)
    
    try {
      const uniqueUrl = nanoid(10)
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          unique_url: uniqueUrl,
          name: formData.name,
          date: formData.date || null,
          location: formData.location || null,
          description: formData.description || null,
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/events/${uniqueUrl}`)
    } catch (error) {
      console.error('Error creating event:', error)
      alert('イベントの作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header 
        title="新しいイベント"
        action={
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        }
      />
      
      <main className="container mx-auto max-w-lg p-4 pb-20">
        <Card>
          <CardHeader>
            <CardTitle>イベント情報を入力</CardTitle>
            <CardDescription>
              割り勘を管理するイベントの詳細を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">イベント名 *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="例: 沖縄旅行、忘年会"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">
                  <Calendar className="mr-2 inline h-4 w-4" />
                  日付
                </Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="mr-2 inline h-4 w-4" />
                  場所
                </Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="例: 東京、レストラン名"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">説明・メモ</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="イベントの詳細や注意事項など"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={!formData.name || isLoading}
              >
                {isLoading ? '作成中...' : 'イベントを作成'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  )
}