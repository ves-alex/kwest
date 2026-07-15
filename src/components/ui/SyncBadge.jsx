import { useState, useEffect } from 'react'
import { CloudOff } from 'lucide-react'
import { getSyncState } from '../../lib/sync'

// Visible UNIQUEMENT quand un push a échoué : des données locales n'ont pas
// atteint le cloud. Silence complet quand tout va bien — le retry (retour du
// réseau, app remise au premier plan) fait disparaître le badge tout seul.
export default function SyncBadge() {
  const [state, setState] = useState(getSyncState)
  useEffect(() => {
    const handler = () => setState(getSyncState())
    window.addEventListener('kwest:sync-change', handler)
    return () => window.removeEventListener('kwest:sync-change', handler)
  }, [])

  if (state !== 'error') return null

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center"
      style={{ top: 'calc(env(safe-area-inset-top) + 8px)' }}
    >
      <p className="flex items-center gap-1.5 rounded-full border border-ember/60 bg-charcoal/90 px-3 py-1 text-[9px] uppercase tracking-[0.2em] text-ember backdrop-blur-sm">
        <CloudOff size={11} />
        Non synchronisé · renvoi auto
      </p>
    </div>
  )
}
