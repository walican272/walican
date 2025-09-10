'use client'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-semibold">設定</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 pb-20">
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-2">設定</h2>
            <p className="text-sm text-muted-foreground">
              アプリケーションの設定
            </p>
            <div className="mt-4">
              <p className="text-muted-foreground">
                設定機能は現在メンテナンス中です
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}