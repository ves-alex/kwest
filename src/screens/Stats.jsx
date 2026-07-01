import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { loadSessions, deleteSession, getPersonalRecord } from '../storage/sessions'
import { findExerciseById } from '../domain/exercises'
import SwipeToDelete from '../components/ui/SwipeToDelete'
import ConfirmModal from '../components/ui/ConfirmModal'
import ProgressChart from '../components/ui/ProgressChart'

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
  const [view, setView] = useState('sessions') // 'sessions' | 'progression'
  const [selectedExoId, setSelectedExoId] = useState(null)
  const [exoQuery, setExoQuery] = useState('')

  const exercisesInHistory = useMemo(() => {
    const counts = {}
    for (const s of sessions) {
      for (const e of s.entries) {
        counts[e.exerciseId] = (counts[e.exerciseId] ?? 0) + 1
      }
    }
    return Object.entries(counts)
      .map(([id, count]) => ({ exo: findExerciseById(id), id, count }))
      .filter((x) => x.exo)
      .sort((a, b) => b.count - a.count)
  }, [sessions])

  const filteredExos = useMemo(() => {
    if (!exoQuery.trim()) return exercisesInHistory
    const q = exoQuery.toLowerCase()
    return exercisesInHistory.filter((x) => x.exo.name.toLowerCase().includes(q))
  }, [exercisesInHistory, exoQuery])

  const progressionData = useMemo(() => {
    if (!selectedExoId) return []
    return sessions
      .filter((s) => s.entries.some((e) => e.exerciseId === selectedExoId))
      .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt))
      .slice(-10)
      .map((s) => {
        const entry = s.entries.find((e) => e.exerciseId === selectedExoId)
        const maxWeight = Math.max(0, ...entry.sets.map((set) => parseFloat(set.weight) || 0))
        return {
          date: new Date(s.startedAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          }),
          maxWeight,
        }
      })
      .filter((d) => d.maxWeight > 0)
  }, [sessions, selectedExoId])

  const selectedPR = useMemo(
    () => (selectedExoId ? getPersonalRecord(selectedExoId, sessions) : null),
    [sessions, selectedExoId]
  )

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
        {sessions.length > 0 && (
          <div className="mt-6 flex justify-center gap-1">
            {['sessions', 'progression'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => { setView(v); setSelectedExoId(null); setExoQuery('') }}
                className={`rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors ${
                  view === v
                    ? 'bg-ember/15 text-cream border border-ember/40'
                    : 'border border-forge-light text-ash hover:border-ash/60 hover:text-cream'
                }`}
              >
                {v === 'sessions' ? 'Séances' : 'Progression'}
              </button>
            ))}
          </div>
        )}
      </header>

      <section className="mx-auto mt-8 max-w-md">
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-forge-light bg-forge/40 p-8 text-center">
            <p className="text-sm text-ash">
              Ton historique est vide. Termine une séance et elle s'inscrira ici.
            </p>
          </div>
        ) : view === 'sessions' ? (
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
        ) : selectedExoId ? (
          /* --- Vue progression d'un exercice --- */
          <div>
            <button
              type="button"
              onClick={() => setSelectedExoId(null)}
              className="mb-4 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-ash transition-colors hover:text-cream"
            >
              <ArrowLeft size={12} />
              Tous les exercices
            </button>
            <div className="rounded-2xl border border-forge-light bg-forge p-5">
              <p className="text-xs font-medium text-cream">
                {findExerciseById(selectedExoId)?.name ?? selectedExoId}
              </p>
              {progressionData.length >= 2 ? (
                <>
                  <div className="mt-4">
                    <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-ash/50">
                      Poids max par séance (kg)
                    </p>
                    <ProgressChart data={progressionData} />
                  </div>
                  {selectedPR && (
                    <div className="mt-4 flex gap-6">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-ash/50">Record</p>
                        <p className="mt-1 text-sm font-medium text-ember">
                          {selectedPR.weight}kg × {selectedPR.reps}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-ash/50">Séances</p>
                        <p className="mt-1 text-sm font-medium text-cream">
                          {exercisesInHistory.find((x) => x.id === selectedExoId)?.count ?? '—'}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : progressionData.length === 1 ? (
                <p className="mt-3 text-xs text-ash/60">
                  1 séance avec ce poids. Reviens après quelques séances pour voir ta progression.
                </p>
              ) : (
                <p className="mt-3 text-xs text-ash/60">
                  Exercice sans charge enregistrée — pas de courbe de progression.
                </p>
              )}
            </div>
          </div>
        ) : (
          /* --- Liste des exercices --- */
          <div>
            <input
              type="text"
              value={exoQuery}
              onChange={(e) => setExoQuery(e.target.value)}
              placeholder="Chercher un exercice…"
              className="mb-4 w-full rounded-xl border border-forge-light bg-forge px-4 py-2.5 text-sm text-cream placeholder:text-ash/50 focus:border-ember focus:outline-none"
            />
            {filteredExos.length === 0 ? (
              <p className="text-center text-sm text-ash/60">Aucun exercice trouvé.</p>
            ) : (
              <ul className="space-y-2">
                {filteredExos.map(({ exo, id, count }) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => setSelectedExoId(id)}
                      className="flex w-full items-center justify-between rounded-2xl border border-forge-light bg-forge p-4 text-left transition-colors hover:border-ember"
                    >
                      <div>
                        <p className="text-sm font-medium text-cream">{exo.name}</p>
                        <p className="mt-0.5 text-[10px] text-ash/60">
                          {count} séance{count > 1 ? 's' : ''}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-ash" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
