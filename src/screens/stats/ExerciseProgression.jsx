import { useMemo, useState } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { findExerciseById, getMetric, getMetricUnit } from '../../domain/exercises'
import { getPersonalRecord } from '../../storage/sessions'
import { setsForExercise } from '../../domain/sets'
import { bestOneRepMax, sessionOneRepMax } from '../../domain/oneRepMax'
import { formatPerf, metricValueUnit } from '../../lib/format'
import ProgressChart from '../../components/ui/ProgressChart'
import TrainingHeatmap from '../../components/ui/TrainingHeatmap'

function ExerciseDetail({ sessions, exercisesInHistory, selectedExoId, onBack }) {
  const [selectedDay, setSelectedDay] = useState(null)
  const [chartMode, setChartMode] = useState('perf')
  const metric = getMetric(selectedExoId)
  const unit = getMetricUnit(selectedExoId)
  const isCharge = metric === 'charge'
  const valUnit = metricValueUnit(metric, unit)
  const chartLabel = isCharge
    ? 'Poids max par séance (kg)'
    : metric === 'temps'
      ? `Meilleure durée par séance (${valUnit})`
      : 'Meilleures reps par séance'

  // Un point par séance (10 dernières) : la perf brute ET le 1RM estimé.
  // La clé reste `maxWeight` car c'est ce que lit ProgressChart.
  const sessionPoints = useMemo(() => {
    return sessions
      .filter((s) => s.entries.some((e) => e.exerciseId === selectedExoId))
      .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt))
      .slice(-10)
      .map((s) => {
        const sets = setsForExercise(s, selectedExoId)
        const value = isCharge
          ? Math.max(0, ...sets.map((set) => parseFloat(set.weight) || 0))
          : Math.max(0, ...sets.map((set) => parseFloat(set.reps) || 0))
        return {
          date: new Date(s.startedAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          }),
          maxWeight: value,
          oneRm: isCharge ? bestOneRepMax(sets) : 0,
        }
      })
  }, [sessions, selectedExoId, isCharge])

  const progressionData = useMemo(
    () => sessionPoints.filter((d) => d.maxWeight > 0),
    [sessionPoints]
  )

  // Série 1RM : seules les séances avec au moins une série exploitable (≤ 12 reps)
  // y figurent, donc elle peut être plus courte que la courbe des poids.
  const oneRmData = useMemo(
    () => sessionPoints.filter((d) => d.oneRm > 0).map((d) => ({ date: d.date, maxWeight: d.oneRm })),
    [sessionPoints]
  )

  const best1Rm = useMemo(() => {
    if (!isCharge) return 0
    let best = 0
    for (const s of sessions) {
      const v = sessionOneRepMax(s, selectedExoId)
      if (v > best) best = v
    }
    return best
  }, [sessions, selectedExoId, isCharge])

  const canShow1Rm = isCharge && oneRmData.length >= 2
  const showing1Rm = canShow1Rm && chartMode === '1rm'
  const chartData = showing1Rm ? oneRmData : progressionData

  const selectedPR = useMemo(
    () => getPersonalRecord(selectedExoId, sessions),
    [sessions, selectedExoId]
  )

  const exerciseTrainedSet = useMemo(() => {
    const set = new Set()
    for (const s of sessions) {
      if (s.entries.some((e) => e.exerciseId === selectedExoId)) {
        const d = new Date(s.startedAt)
        d.setHours(0, 0, 0, 0)
        set.add(d.toISOString().slice(0, 10))
      }
    }
    return set
  }, [sessions, selectedExoId])

  const dayPR = useMemo(() => {
    if (!selectedDay) return null
    let best = null
    for (const s of sessions) {
      const d = new Date(s.startedAt)
      d.setHours(0, 0, 0, 0)
      if (d.toISOString().slice(0, 10) !== selectedDay) continue
      for (const set of setsForExercise(s, selectedExoId)) {
        const w = parseFloat(set.weight) || 0
        const r = parseFloat(set.reps) || 0
        if (isCharge) {
          if (!best || w > best.weight || (w === best.weight && r > best.reps)) {
            best = { weight: w, reps: r }
          }
        } else if (!best || r > best.reps) {
          best = { weight: 0, reps: r }
        }
      }
    }
    return best
  }, [sessions, selectedExoId, selectedDay, isCharge])

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
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
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[9px] uppercase tracking-[0.2em] text-ash/50">
                  {showing1Rm ? '1RM estimé par séance (kg)' : chartLabel}
                </p>
                {canShow1Rm && (
                  <div className="flex shrink-0 rounded-full border border-forge-light p-0.5">
                    {[
                      ['perf', 'Poids'],
                      ['1rm', '1RM'],
                    ].map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setChartMode(mode)}
                        className={`rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.15em] transition-colors ${
                          chartMode === mode
                            ? 'bg-ember/25 text-cream'
                            : 'text-ash/60 hover:text-cream'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <ProgressChart data={chartData} unit={isCharge ? 'kg' : valUnit} />
              {showing1Rm && (
                <p className="mt-2 text-[10px] leading-relaxed text-ash/50">
                  Charge théorique sur une seule répétition (formule d'Epley). Elle monte
                  aussi quand tu fais plus de reps au même poids — les séries au-delà de
                  12 reps sont écartées.
                </p>
              )}
            </div>
            {selectedPR && (
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-ash/50">Record</p>
                  <p className="mt-1 text-sm font-medium text-ember">
                    {formatPerf(metric, unit, selectedPR)}
                  </p>
                </div>
                {best1Rm > 0 && (
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-ash/50">1RM estimé</p>
                    <p className="mt-1 text-sm font-medium text-cream">{best1Rm} kg</p>
                  </div>
                )}
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-ash/50">Séances</p>
                  <p className="mt-1 text-sm font-medium text-cream">
                    {exercisesInHistory.find((x) => x.id === selectedExoId)?.count ?? '—'}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="mt-3 text-xs text-ash/60">
            {progressionData.length === 1
              ? '1 séance enregistrée. Reviens après quelques séances pour voir ta progression.'
              : 'Pas encore assez de données pour tracer une courbe.'}
          </p>
        )}
        <div className="mt-5 border-t border-forge-light/40 pt-4">
          <p className="mb-3 text-[9px] uppercase tracking-[0.25em] text-ash/50">
            Fréquence · 8 semaines
          </p>
          <TrainingHeatmap
            trainedSet={exerciseTrainedSet}
            numWeeks={8}
            selectedDay={selectedDay}
            onDayClick={(key) => setSelectedDay((prev) => (prev === key ? null : key))}
          />
          {selectedDay && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-forge-light/60 bg-charcoal px-3 py-2">
              <p className="text-[10px] text-ash">
                {(() => {
                  const [y, m, d] = selectedDay.split('-').map(Number)
                  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })
                })()}
              </p>
              <span className="text-ash/30">·</span>
              {dayPR ? (
                <p className="text-sm font-medium text-ember">
                  {formatPerf(metric, unit, dayPR)}
                </p>
              ) : (
                <p className="text-[10px] text-ash/50">aucun set enregistré</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ExerciseList({ exercisesInHistory, query, onQueryChange, onSelect }) {
  const filtered = useMemo(() => {
    if (!query.trim()) return exercisesInHistory
    const q = query.toLowerCase()
    return exercisesInHistory.filter((x) => x.exo.name.toLowerCase().includes(q))
  }, [exercisesInHistory, query])

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Chercher un exercice…"
        className="mb-4 w-full rounded-xl border border-forge-light bg-forge px-4 py-2.5 text-sm text-cream placeholder:text-ash/50 focus:border-ember focus:outline-none"
      />
      {filtered.length === 0 ? (
        <p className="text-center text-sm text-ash/60">Aucun exercice trouvé.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map(({ exo, id, count }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onSelect(id)}
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
  )
}

export default function ExerciseProgression({ sessions, exercisesInHistory }) {
  const [selectedExoId, setSelectedExoId] = useState(null)
  const [query, setQuery] = useState('')

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-forge-light bg-forge/40 p-8 text-center">
        <p className="text-sm text-ash">
          Tes exercices et ta progression apparaîtront ici après ta première séance.
        </p>
      </div>
    )
  }

  if (selectedExoId) {
    return (
      <ExerciseDetail
        sessions={sessions}
        exercisesInHistory={exercisesInHistory}
        selectedExoId={selectedExoId}
        onBack={() => setSelectedExoId(null)}
      />
    )
  }

  return (
    <ExerciseList
      exercisesInHistory={exercisesInHistory}
      query={query}
      onQueryChange={setQuery}
      onSelect={setSelectedExoId}
    />
  )
}
