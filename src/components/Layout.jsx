import { useEffect, useState, Suspense } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { loadPlayer } from '../storage/player'
import { FOND_STYLES } from '../theme/fonds'
import BottomTabBar from './BottomTabBar'
import SyncBadge from './ui/SyncBadge'

export default function Layout() {
  const location = useLocation()
  const outlet = useOutlet()
  const [player, setPlayer] = useState(loadPlayer)
  useEffect(() => {
    const handler = () => setPlayer(loadPlayer())
    window.addEventListener('kwest:player-change', handler)
    return () => window.removeEventListener('kwest:player-change', handler)
  }, [])

  const fondId = player.cosmeticsEquipped?.fond

  return (
    <div className="relative min-h-screen">
      {/* Fond cosmétique global, fixe au viewport */}
      {(FOND_STYLES[fondId] ?? []).map((layer, i) => (
        <div
          key={i}
          className={`pointer-events-none fixed ${layer}`}
          aria-hidden
        />
      ))}

      <main
        className="relative"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Suspense local : un onglet lazy en cours de chargement ne doit
                pas faire tomber le Layout (tab bar) sur le fallback global */}
            <Suspense fallback={null}>{outlet}</Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomTabBar />
      <SyncBadge />
    </div>
  )
}
