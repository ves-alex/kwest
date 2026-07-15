import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { loadPlayer } from './storage/player'
import { migrateSessionsStrictV1 } from './storage/sessions'
import { supabase } from './lib/supabase'
import { loadFromCloud, initSyncRetry } from './lib/sync'
import Layout from './components/Layout'
import Home from './screens/Home'
import Session from './screens/Session'

// Les deux onglets principaux (Refuge, Séance) restent dans le chunk initial ;
// tout le reste se charge à la demande. Après l'installation PWA, ces chunks
// sont précachés par le service worker → chargement instantané quand même.
const Shop = lazy(() => import('./screens/Shop'))
const Stats = lazy(() => import('./screens/Stats'))
const SessionDetail = lazy(() => import('./screens/SessionDetail'))
const ExercisePicker = lazy(() => import('./screens/ExercisePicker'))
const Onboarding = lazy(() => import('./screens/Onboarding'))
const Login = lazy(() => import('./screens/Login'))
const Settings = lazy(() => import('./screens/Settings'))
const RoutineComposer = lazy(() => import('./screens/RoutineComposer'))

const splash = (
  <div className="fixed inset-0 flex items-center justify-center bg-charcoal">
    <p className="font-display text-3xl tracking-widest text-ember animate-pulse">kwest</p>
  </div>
)

function App() {
  const [authState, setAuthState] = useState('loading') // 'loading' | 'unauthenticated' | 'ready'
  const [player, setPlayer] = useState(null)

  useEffect(() => {
    // Filet de sécurité : repousse les données locales dès que le réseau
    // revient ou que la PWA repasse au premier plan (push raté à la salle…)
    initSyncRetry()

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
    return splash
  }

  if (authState === 'unauthenticated') {
    return (
      <Suspense fallback={splash}>
        <Login />
      </Suspense>
    )
  }

  if (!player?.gender) {
    return (
      <Suspense fallback={splash}>
        <Onboarding onComplete={setPlayer} />
      </Suspense>
    )
  }

  return (
    <BrowserRouter>
      {/* Suspense externe : couvre les écrans plein-page hors Layout (picker, composer) */}
      <Suspense fallback={splash}>
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
      </Suspense>
    </BrowserRouter>
  )
}

export default App
