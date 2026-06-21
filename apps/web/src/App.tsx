import { useEffect, useState } from 'react'
import { apiGet } from './api/client'
import './App.css'

type ReadyResponse = {
  status: string
  database?: string
}

function App() {
  const [ready, setReady] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    apiGet<ReadyResponse>('/ready')
      .then((body) => {
        setReady(body.status === 'ok' && body.database === 'ok' ? 'ok' : 'error')
      })
      .catch(() => setReady('error'))
  }, [])

  return (
    <div className="app">
      <header className="header">
        <h1>Glanta</h1>
        <p className="tagline">Agent observability</p>
      </header>
      <main className="main">
        <p className="api-status">
          API:{' '}
          {ready === 'loading' && 'checking…'}
          {ready === 'ok' && 'connected'}
          {ready === 'error' && 'unreachable — start the API and Postgres'}
        </p>
        <p className="placeholder">Dashboard runs list coming in Phase 2.</p>
      </main>
    </div>
  )
}

export default App
