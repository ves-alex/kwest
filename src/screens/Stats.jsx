import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { loadSessions, deleteSession } from '../storage/sessions'
import { findExerciseById } from '../domain/exercises'
import SwipeToDelete from '../components/ui/SwipeToDelete'
import ConfirmModal from '../components/ui/ConfirmModal'

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatRelativeDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const time = d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  if (isSameDay(d, now)) return `Aujourd'hui à ${time}`
  if (isSameDay(d, yesterday)) return `Hier à ${time}`
  return (
    d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }) + ` · ${time}`
  )
}

function formatDuration(startISO, endISO) {
  if (!endISO) return '—'
  const mins = Math.round((new Date(endISO) - new Date(startISO)) / 60000)
  if (mins < 1) return '< 1 min'
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h} h` : `${h} h ${m}`
}

function countSets(session) {
  return session.entries.reduce((acc, e) => acc + e.sets.length, 0)
}

export default function Stats() {
  const [sessions, setSessions] = useState(() =>
    loadSessions().sort(
      (a, b) => new Date(b.startedAt) - new Date(a.startedAt)
    )
  )
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  const handleDelete = (id) => {
    setPendingDeleteId(id)
    return false // snap back, le modal gère la confirmation
  }

  const confirmDelete = () => {
    if (!pendingDeleteId) return
    deleteSession(pendingDeleteId)
    setSessions((prev) => prev.filter((s) => s.id !== pendingDeleteId))
    setPendingDeleteId(null)
  }

  return (
    <div className="px-6 py-10">
      <header className="mx-auto max-w-md text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-ash">
          {sessions.length === 0
            ? 'rien à raconter encore'
            : `${sessions.length} séance${sessions.length > 1 ? 's' : ''} forgée${sessions.length > 1 ? 's' : ''}`}
        </p>
        <h1 className="mt-4 font-display text-4xl uppercase tracking-[0.15em] text-cream sm:text-5xl sm:tracking-[0.2em]">
          Chroniques
        </h1>
      </header>

      <section className="mx-auto mt-10 max-w-md">
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-forge-light bg-forge/40 p-8 text-center">
            <p className="text-sm text-ash">
              Ton historique est vide. Termine une séance et elle s'inscrira ici.
            </p>
          </div>
        ) : (
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
                      exit={{
                        x: -400,
                        opacity: 0,
                        height: 0,
                        marginTop: 0,
                      }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <SwipeToDelete onDelete={() => handleDelete(s.id)}>
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
                              {exos} exercice{exos > 1 ? 's' : ''} ·{' '}
                              {sets} série{sets > 1 ? 's' : ''}
                              {firstExo && exos > 0 && (
                                <span className="text-ash/70">
                                  {' '}
                                  · {firstExo}
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
        )}
      </section>
      <ConfirmModal
        isOpen={!!pendingDeleteId}
        title="Supprimer cette séance ?"
        message="Cette action est irréversible. La séance sera retirée de tes chroniques."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
