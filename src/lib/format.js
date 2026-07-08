// Unité affichée pour la valeur principale d'une série, selon le type de mesure.
// metric 'temps' → 's' ou 'min' ; sinon → 'reps'.
export function metricValueUnit(metric, unit) {
  if (metric === 'temps') return unit === 'min' ? 'min' : 's'
  return 'reps'
}

// Résumé court d'une perf selon le type de mesure.
// `reps` porte la valeur principale (répétitions ou durée). Ex :
//   charge → "80kg × 5" (ou "12 reps" si sans lest) · reps → "20 reps" · temps → "45 s"
export function formatPerf(metric, unit, { reps, weight } = {}) {
  const r = reps === '' || reps == null ? '—' : reps
  if (metric === 'temps') return `${r} ${unit === 'min' ? 'min' : 's'}`
  if (metric === 'reps') return `${r} reps`
  const w = parseFloat(weight) || 0
  return w > 0 ? `${weight}kg × ${r}` : `${r} reps`
}

// Durée d'une séance : "12 min", "1 h 30", "< 1 min"
export function formatDuration(startISO, endISO) {
  if (!endISO) return '—'
  const mins = Math.round((new Date(endISO) - new Date(startISO)) / 60000)
  if (mins < 1) return '< 1 min'
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h} h` : `${h} h ${m}`
}

// Chrono en cours : "5:23" ou "1:05:23"
export function formatElapsed(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

// Date longue : "lundi 2 juillet à 16:52"
export function formatStartedAt(iso) {
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Date relative : "Aujourd'hui à 14:30", "Hier à 09:15", "lundi 2 juillet · 16:52"
export function formatRelativeDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
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

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
