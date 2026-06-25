import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { loadPlayer, initPlayerGender } from './storage/player'
import Layout from './components/Layout'
import Home from './screens/Home'
import Session from './screens/Session'
import Shop from './screens/Shop'
import Stats from './screens/Stats'
import SessionDetail from './screens/SessionDetail'
import ExercisePicker from './screens/ExercisePicker'
import Onboarding from './screens/Onboarding'

function initPlayer() {
  const p = loadPlayer()
  // Migration : gender défini avant le système de skins → assigner la skin de départ
  if (p.gender && !p.cosmeticsEquipped?.skin) {
    const starter = p.gender === 'F' ? 'skin-f1' : 'skin-m1'
    return initPlayerGender(p.gender, starter)
  }
  return p
}

function App() {
  const [player, setPlayer] = useState(initPlayer)

  if (!player.gender) {
    return <Onboarding onComplete={setPlayer} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="session" element={<Session />} />
          <Route path="shop" element={<Shop />} />
          <Route path="stats" element={<Stats />} />
          <Route path="stats/:id" element={<SessionDetail />} />
        </Route>
        <Route path="session/picker" element={<ExercisePicker />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
