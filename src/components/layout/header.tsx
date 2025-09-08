interface HeaderProps {
  title: string | React.ReactNode
  action?: React.ReactNode
  backButton?: React.ReactNode
}

export function Header({ title, action, backButton }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {backButton && <div className="flex-shrink-0 mr-3">{backButton}</div>}
        <div className="flex-1 overflow-hidden">
          {typeof title === 'string' ? (
            <h1 className="text-lg font-semibold">{title}</h1>
          ) : (
            title
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </header>
  )
}