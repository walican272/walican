'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, History, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  eventUrl?: string
  onAddClick?: () => void
}

export function BottomNav({ eventUrl, onAddClick }: BottomNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/',
      icon: Home,
      label: 'ホーム',
    },
    {
      href: '/expense/new',
      icon: Plus,
      label: '追加',
      isAddButton: true,
    },
    {
      href: '/settlements',
      icon: History,
      label: '精算',
    },
    {
      href: '/settings',
      icon: Settings,
      label: '設定',
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="grid h-16 grid-cols-4">
        {navItems.map((item) => {
          const href = eventUrl && item.href !== '/' ? `/events/${eventUrl}${item.href}` : item.href
          const isActive = pathname === href
          const Icon = item.icon

          // 追加ボタンでonAddClickが指定されている場合はボタンとして動作
          if (item.isAddButton && onAddClick && eventUrl) {
            return (
              <button
                key={item.href}
                onClick={onAddClick}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 text-xs transition-colors',
                  'text-muted-foreground hover:text-primary',
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}