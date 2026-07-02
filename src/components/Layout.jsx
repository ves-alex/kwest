import { useEffect, useState } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { loadPlayer } from '../storage/player'
import BottomTabBar from './BottomTabBar'

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
      {fondId === 'fond-forge-silencieuse' && (
        <>
          <div
            className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_95%,_var(--color-ember)_0%,_transparent_55%)] opacity-[0.5]"
            aria-hidden
          />
          <div
            className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-[linear-gradient(to_bottom,_var(--color-charcoal)_0%,_transparent_100%)] opacity-80"
            aria-hidden
          />
        </>
      )}

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
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomTabBar />
    </div>
  )
}
