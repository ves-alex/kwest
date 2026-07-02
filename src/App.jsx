import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { loadPlayer } from './storage/player'
import { migrateSessionsStrictV1 } from './storage/sessions'
import { supabase } from './lib/supabase'
import { loadFromCloud } from './lib/sync'
import Layout from './components/Layout'
import Home from './screens/Home'
import Session from './screens/Session'
import Shop from './screens/Shop'
import Stats from './screens/Stats'
import SessionDetail from './screens/SessionDetail'
import ExercisePicker from './screens/ExercisePicker'
import Onboarding from './screens/Onboarding'
import Login from './screens/Login'
import Settings from './screens/Settings'
import RoutineComposer from './screens/RoutineComposer'

function App() {
  const [authState, setAuthState] = useState('loading') // 'loading' | 'unauthenticated' | 'ready'
  const [player, setPlayer] = useState(null)

  useEffect(() => {
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (!session) {
          setAuthState('unauthenticated')
          return
        }
        await loadFromCloud(session.user.id)
        migrateSessionsStrictV1()
        setPlayer(loadPlayer())
        setAuthState('ready')
      })
      .catch((err) => {
        console.error('[kwest] getSession failed', err)
        setAuthState('unauthenticated')
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await loadFromCloud(session.user.id)
        migrateSessionsStrictV1()
        setPlayer(loadPlayer())
        setAuthState('ready')
      }
      if (event === 'SIGNED_OUT') {
        setPlayer(null)
        setAuthState('unauthenticated')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (authState === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-charcoal">
        <p className="font-display text-3xl tracking-widest text-ember animate-pulse">kwest</p>
      </div>
    )
  }

  if (authState === 'unauthenticated') {
    return <Login />
  }

  if (!player?.gender) {
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
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="session/picker" element={<ExercisePicker />} />
        <Route path="routines/new" element={<RoutineComposer />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
