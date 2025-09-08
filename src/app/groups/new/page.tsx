'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Users, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function NewGroupPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    members: ['']
  })

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('グループ名を入力してください')
      return
    }

    setIsCreating(true)
    
    try {
      // グループを作成
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([{
          name: formData.name,
          description: formData.description
        }])
        .select()
        .single()

      if (groupError) throw groupError

      // メンバーを追加
      const validMembers = formData.members.filter(email => email.trim())
      if (validMembers.length > 0) {
        const memberRecords = validMembers.map(email => ({
          group_id: groupData.id,
          user_email: email.trim(),
          role: 'member'
        }))

        const { error: memberError } = await supabase
          .from('group_members')
          .insert(memberRecords)

        if (memberError) {
          console.error('Error adding members:', memberError)
        }
      }

      alert('グループを作成しました！')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error creating group:', error)
      alert('グループの作成に失敗しました')
    } finally {
      setIsCreating(false)
    }
  }

  const addMemberField = () => {
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, '']
    }))
  }

  const updateMember = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.map((m, i) => i === index ? value : m)
    }))
  }

  const removeMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }))
  }

  return (
    <>
      <Header 
        title="新しいグループ"
        backButton={
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        }
      />

      <main className="container mx-auto p-4 pb-20">
        <form onSubmit={handleCreateGroup} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <Users className="mr-2 inline h-5 w-5" />
                グループ情報
              </CardTitle>
              <CardDescription>
                グループの基本情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">グループ名 *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="例: 家族旅行メンバー"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  placeholder="グループの説明を入力（任意）"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>メンバー</CardTitle>
              <CardDescription>
                グループに招待するメンバーのメールアドレスを入力
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.members.map((member, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="メールアドレス"
                    value={member}
                    onChange={(e) => updateMember(index, e.target.value)}
                  />
                  {formData.members.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMember(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addMemberField}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                メンバーを追加
              </Button>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isCreating}
          >
            {isCreating ? '作成中...' : 'グループを作成'}
          </Button>
        </form>
      </main>
    </>
  )
}