import { Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="app">
      <header className="header">
        <h1>Glanta</h1>
        <p className="tagline">Agent observability</p>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
