import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import SwipeToDelete from '../../components/ui/SwipeToDelete'
import { findExerciseById } from '../../domain/exercises'
import { formatDuration, formatRelativeDate } from '../../lib/format'

function countSets(session) {
  return session.entries.reduce((acc, e) => acc + e.sets.length, 0)
}

export default function SessionsList({ sessions, onDelete }) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-forge-light bg-forge/40 p-8 text-center">
        <p className="text-sm text-ash">
          Ton historique est vide. Termine une séance et elle s'inscrira ici.
        </p>
      </div>
    )
  }

  return (
    <>
      <p className="mb-4 text-center text-[10px] uppercase tracking-[0.3em] text-ash/60">
        ← glisse pour supprimer
      </p>
      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {sessions.map((s) => {
            const exos = s.entries.length
            const sets = countSets(s)
            const firstExo = s.entries[0]
              ? findExerciseById(s.entries[0].exerciseId)?.name
              : null
            return (
              <motion.li
                key={s.id}
                exit={{ x: -400, opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <SwipeToDelete onDelete={() => onDelete(s.id)}>
                  <Link
                    to={`/stats/${s.id}`}
                    className="block rounded-2xl border border-forge-light bg-forge p-4 transition-colors hover:border-ember"
                  >
                    <header className="flex items-baseline justify-between gap-3">
                      <p className="font-medium text-cream first-letter:uppercase">
                        {formatRelativeDate(s.startedAt)}
                      </p>
                      <span className="text-[10px] uppercase tracking-wider text-ash">
                        {formatDuration(s.startedAt, s.endedAt)}
                      </span>
                    </header>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-ash">
                        {exos} exercice{exos > 1 ? 's' : ''} · {sets} série{sets > 1 ? 's' : ''}
                        {firstExo && exos > 0 && (
                          <span className="text-ash/70">
                            {' '}· {firstExo}
                            {exos > 1 ? '…' : ''}
                          </span>
                        )}
                      </p>
                      <ChevronRight size={16} className="text-ash" />
                    </div>
                  </Link>
                </SwipeToDelete>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </>
  )
}
