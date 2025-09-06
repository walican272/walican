'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Home,
  Calendar,
  Users,
  Settings,
  LogOut,
  User,
  Wallet,
  Menu
} from 'lucide-react'

export function Navigation() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Wallet className="h-5 w-5" />
          <span>Walican</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button 
                variant={pathname === '/dashboard' ? 'secondary' : 'ghost'} 
                size="sm"
                className="hidden sm:flex"
              >
                <Home className="mr-2 h-4 w-4" />
                ダッシュボード
              </Button>
            </Link>

            <Link href="/events">
              <Button 
                variant={pathname.startsWith('/events') ? 'secondary' : 'ghost'} 
                size="sm"
                className="hidden sm:flex"
              >
                <Calendar className="mr-2 h-4 w-4" />
                イベント
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <Link href="/dashboard">
                  <DropdownMenuItem className="sm:hidden">
                    <Home className="mr-2 h-4 w-4" />
                    ダッシュボード
                  </DropdownMenuItem>
                </Link>
                
                <Link href="/events">
                  <DropdownMenuItem className="sm:hidden">
                    <Calendar className="mr-2 h-4 w-4" />
                    イベント
                  </DropdownMenuItem>
                </Link>

                <Link href="/groups">
                  <DropdownMenuItem>
                    <Users className="mr-2 h-4 w-4" />
                    グループ
                  </DropdownMenuItem>
                </Link>

                <Link href="/settings">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    設定
                  </DropdownMenuItem>
                </Link>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                ログイン
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">
                新規登録
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}