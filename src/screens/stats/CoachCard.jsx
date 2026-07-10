import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Hammer, Loader2 } from 'lucide-react'
import { askCoach } from '../../lib/coach'

// Carte "Le Forgeron" : demande un bilan/conseil à l'IA sur l'historique.
export default function CoachCard() {
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [conseil, setConseil] = useState('')
  const [error, setError] = useState('')

  const consulter = async () => {
    setStatus('loading')
    setError('')
    try {
      const c = await askCoach()
      setConseil(c)
      setStatus('done')
    } catch (e) {
      setError(e.message)
      setStatus('error')
    }
  }

  return (
    <div className="rounded-2xl border border-ember/40 bg-forge p-5">
      <div className="flex items-center gap-2.5">
        <Hammer size={16} className="text-ember" />
        <p className="font-display text-sm uppercase tracking-[0.2em] text-cream">Le Forgeron</p>
      </div>
      <p className="mt-1.5 text-[11px] text-ash">
        Un regard sur tes dernières semaines de travail à l'enclume.
      </p>

      <AnimatePresence mode="wait">
        {status === 'done' && (
          <motion.p
            key="conseil"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 whitespace-pre-line border-l-2 border-ember/50 pl-3 text-[13px] leading-relaxed text-cream/90"
          >
            {conseil}
          </motion.p>
        )}
        {status === 'error' && (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-[12px] text-ash"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={consulter}
        disabled={status === 'loading'}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-md border border-ember bg-forge px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-cream transition-colors hover:bg-ember/20 disabled:opacity-60"
      >
        {status === 'loading' ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Le Forgeron t'examine…
          </>
        ) : status === 'done' || status === 'error' ? (
          'Redemander conseil'
        ) : (
          'Consulter le Forgeron'
        )}
      </button>
    </div>
  )
}
