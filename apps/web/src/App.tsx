import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RunDetailPage } from './pages/RunDetailPage'
import { RunsListPage } from './pages/RunsListPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<RunsListPage />} />
        <Route path="/runs/:runId" element={<RunDetailPage />} />
      </Route>
    </Routes>
  )
}

export default App
