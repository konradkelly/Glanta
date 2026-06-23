import { Link, Outlet } from 'react-router-dom'
import { TreeRingLogo } from './logos/TreeRingLogo'

export function Layout() {
  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="header__brand">
          <TreeRingLogo size={40} className="header__mark" />
          <div className="header__text">
            <h1>Glanta</h1>
            <p className="tagline tagline--primary">Agent observability</p>
            <p className="tagline tagline--secondary">
              A clearing in the forest for your agents
            </p>
          </div>
        </Link>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
