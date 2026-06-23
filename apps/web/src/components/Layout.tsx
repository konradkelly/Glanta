import type { ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app">
      <header className="header">
        <h1>Glanta</h1>
        <p className="tagline">Agent observability</p>
      </header>
      <main className="main">{children}</main>
    </div>
  )
}
