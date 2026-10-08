import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { loadPlayer } from './storage/player'
import { migrateSessionsStrictV1 } from './storage/sessions'
import { supabase } from './lib/supabase'
import { loadFromCloud, initSyncRetry } from './lib/sync'
import { hasLocalProfile, canStayOffline } from './lib/startup'
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
  // Profil déjà sur le téléphone : l'app s'ouvre tout de suite dessus, sans
  // attendre le réseau (salle en sous-sol, jeton expiré…) ; le cloud suit en
  // arrière-plan. Sans profil local (première connexion), on attend le cloud.
  const [player, setPlayer] = useState(() => (hasLocalProfile() ? loadPlayer() : null))
  const [authState, setAuthState] = useState(() => (player ? 'ready' : 'loading')) // 'loading' | 'unauthenticated' | 'ready'

  useEffect(() => {
    // Filet de sécurité : repousse les données locales dès que le réseau
    // revient ou que la PWA repasse au premier plan (push raté à la salle…)
    initSyncRetry()

    // Un seul chargement cloud à la fois (démarrage, retour au premier plan,
    // jeton renouvelé au retour du réseau)
    let loading = null
    let lastLoadOk = false
    const syncWithCloud = (userId) => {
      if (!loading) {
        loading = loadFromCloud(userId)
          .then((ok) => {
            lastLoadOk = ok
            migrateSessionsStrictV1()
            setPlayer(loadPlayer())
            setAuthState('ready')
          })
          .finally(() => { loading = null })
      }
      return loading
    }

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (session) return syncWithCloud(session.user.id)
        if (canStayOffline(error, hasLocalProfile())) return
        setAuthState('unauthenticated')
      })
      .catch((err) => {
        console.error('[kwest] getSession failed', err)
        if (!hasLocalProfile()) setAuthState('unauthenticated')
      })

    // Différé (setTimeout) : le SDK attend la fin de ce callback, et la doc
    // Supabase déconseille d'y appeler le client en attendant sa réponse.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setTimeout(() => syncWithCloud(session.user.id), 0)
      }
      // Jeton renouvelé au retour du réseau après un démarrage hors ligne
      if (event === 'TOKEN_REFRESHED' && session && !lastLoadOk) {
        setTimeout(() => syncWithCloud(session.user.id), 0)
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
