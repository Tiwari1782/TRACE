import { Routes, Route, Navigate } from 'react-router-dom'
import { useSocket } from './hooks/useSocket'
import { useStorms } from './hooks/useStorms'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import StormDetailPage from './pages/StormDetailPage'
import GlobeViewPage from './pages/GlobeViewPage'
import LiveWeatherPage from './pages/LiveWeatherPage'

export default function App() {
  useSocket()
  useStorms()

  return (
    <Routes>
      <Route path="/"            element={<HomePage />} />
      <Route path="/map"         element={<MapPage />} />
      <Route path="/globe"       element={<GlobeViewPage />} />
      <Route path="/live-weather" element={<LiveWeatherPage />} />
      <Route path="/tracker"     element={<Navigate to="/map" replace />} />
      <Route path="/storm/:stormId" element={<StormDetailPage />} />
    </Routes>
  )
}
