import { useMemo } from 'react'
import { findExerciseById, GROUPS } from '../../domain/exercises'
import TrainingHeatmap from '../../components/ui/TrainingHeatmap'
import CoachCard from './CoachCard'

function getMonday(d) {
  const day = d.getDay()
  const m = new Date(d)
  m.setDate(m.getDate() - day + (day === 0 ? -6 : 1))
  m.setHours(0, 0, 0, 0)
  return m
}

export default function StatsOverview({ sessions, trainedSet }) {
  const globalStats = useMemo(() => {
    const withEnd = sessions.filter((s) => s.endedAt)
    const avgDuration =
      withEnd.length > 0
        ? Math.round(
            withEnd.reduce(
              (acc, s) => acc + (new Date(s.endedAt) - new Date(s.startedAt)) / 60000,
              0
            ) / withEnd.length
          )
        : 0
    return { avgDuration }
  }, [sessions])

  const weeklyStats = useMemo(() => {
    const thisMonday = getMonday(new Date())
    const weeks = Array.from({ length: 6 }, (_, i) => {
      const start = new Date(thisMonday)
      start.setDate(start.getDate() - (5 - i) * 7)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      return { start, end, count: 0, volume: 0 }
    })
    for (const s of sessions) {
      const d = new Date(s.startedAt)
      const w = weeks.find((wk) => d >= wk.start && d < wk.end)
      if (!w) continue
      w.count++
      w.volume += Math.round(
        s.entries.reduce(
          (t, e) =>
            t +
            e.sets.reduce(
              (acc, set) => acc + (parseFloat(set.reps) || 0) * (parseFloat(set.weight) || 0),
              0
            ),
          0
        )
      )
    }
    return weeks
  }, [sessions])

  const groupStats = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const counts = {}
    for (const s of sessions) {
      if (new Date(s.startedAt) < cutoff) continue
      for (const e of s.entries) {
        const exo = findExerciseById(e.exerciseId)
        if (exo) counts[exo.group] = (counts[exo.group] ?? 0) + e.sets.length
      }
    }
    const max = Math.max(1, ...Object.values(counts))
    return Object.entries(counts)
      .map(([key, sets]) => ({ key, label: GROUPS[key]?.label ?? key, sets, pct: sets / max }))
      .sort((a, b) => b.sets - a.sets)
  }, [sessions])

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-forge-light bg-forge/40 p-8 text-center">
        <p className="text-sm text-ash">
          Termine ta première séance pour voir tes statistiques.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Coaching IA */}
      <CoachCard />

      {/* Heatmap */}
      <div className="rounded-2xl border border-forge-light bg-forge p-5">
        <p className="mb-3 text-[9px] uppercase tracking-[0.25em] text-ash/70">
          Régularité · 12 semaines
        </p>
        <TrainingHeatmap trainedSet={trainedSet} />
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-forge-light bg-forge px-3 py-3 text-center">
          <p className="text-[9px] uppercase tracking-[0.2em] text-ash">Séances</p>
          <p className="mt-1 font-display text-3xl text-cream">{sessions.length}</p>
        </div>
        <div className="rounded-xl border border-forge-light bg-forge px-3 py-3 text-center">
          <p className="text-[9px] uppercase tracking-[0.2em] text-ash">Durée moy.</p>
          <p className="mt-1 font-display text-3xl text-cream">{globalStats.avgDuration}</p>
          <p className="text-[9px] text-ash/50">min</p>
        </div>
      </div>

      {/* Volume hebdo */}
      <div className="rounded-2xl border border-forge-light bg-forge p-5">
        <p className="text-[9px] uppercase tracking-[0.25em] text-ash/70">
          Volume · 6 dernières semaines
        </p>
        {weeklyStats.every((w) => w.volume === 0) ? (
          <p className="mt-3 text-xs text-ash/50">Pas encore assez de séances.</p>
        ) : (
          <div className="mt-4">
            {(() => {
              const maxVol = Math.max(1, ...weeklyStats.map((w) => w.volume))
              return (
                <div className="flex items-end justify-between gap-1.5 h-20">
                  {weeklyStats.map((w, i) => {
                    const isNow = i === weeklyStats.length - 1
                    const barPct = w.volume > 0 ? Math.max(0.04, w.volume / maxVol) : 0
                    const label = w.start.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        {w.count > 0 && (
                          <span className="text-[8px] text-ash/60">{w.count}×</span>
                        )}
                        <div className="w-full flex flex-col justify-end" style={{ height: '56px' }}>
                          <div
                            className={`w-full rounded-sm transition-all ${isNow ? 'bg-ember' : 'bg-forge-light'}`}
                            style={{ height: `${barPct * 100}%` }}
                          />
                        </div>
                        <span className={`text-[8px] ${isNow ? 'text-ember' : 'text-ash/40'}`}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
            <p className="mt-2 text-right text-[8px] text-ash/30">
              hauteur = volume total (kg) · chiffre = nb séances
            </p>
          </div>
        )}
      </div>

      {/* Groupes musculaires */}
      {groupStats.length > 0 && (
        <div className="rounded-2xl border border-forge-light bg-forge p-5">
          <p className="text-[9px] uppercase tracking-[0.25em] text-ash/70">
            Groupes musculaires · 30 jours
          </p>
          <div className="mt-4 space-y-3">
            {groupStats.map(({ key, label, sets, pct }) => (
              <div key={key}>
                <div className="mb-1 flex justify-between">
                  <span className="text-[10px] text-cream">{label}</span>
                  <span className="text-[10px] text-ash/50">{sets} série{sets > 1 ? 's' : ''}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-charcoal">
                  <div
                    className="h-full rounded-full bg-ember transition-all"
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {(() => {
            const allGroups = Object.keys(GROUPS)
            const worked = new Set(groupStats.map((g) => g.key))
            const neglected = allGroups.filter(
              (k) => !worked.has(k) && k !== 'divers' && k !== 'cardio'
            )
            if (neglected.length === 0) return null
            return (
              <p className="mt-4 text-[9px] text-ash/50">
                Non travaillés :{' '}
                {neglected.map((k) => GROUPS[k]?.label).join(', ')}
              </p>
            )
          })()}
        </div>
      )}
    </div>
  )
}
