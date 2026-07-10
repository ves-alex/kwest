import { findExerciseById, getMetric, GROUPS } from './exercises'

// Construit un résumé compact de l'historique d'entraînement, destiné au
// coaching IA. On envoie ces chiffres (et pas les séances brutes) : c'est plus
// léger en tokens et Claude raisonne mieux sur des stats agrégées.

const isCounted = (s) => s.validated !== false
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// Groupes de force surveillés pour repérer les déséquilibres (hors cardio/divers)
const STRENGTH_GROUPS = [
  'poitrine', 'dos', 'epaules', 'biceps', 'triceps',
  'quadriceps', 'ischios-fessiers', 'mollets', 'core',
]

// Clé de semaine (lundi) pour compter les semaines actives
function weekKey(dateInput) {
  const d = new Date(dateInput)
  d.setHours(0, 0, 0, 0)
  const mondayOffset = (d.getDay() + 6) % 7 // lundi = 0
  d.setDate(d.getDate() - mondayOffset)
  return d.toISOString().slice(0, 10)
}

// Meilleure valeur d'une entry : poids max (charge) ou valeur principale max (reps/temps)
function bestOfEntry(entry) {
  const charge = getMetric(entry.exerciseId) === 'charge'
  let best = 0
  for (const set of entry.sets) {
    if (!isCounted(set)) continue
    const reps = parseFloat(set.reps) || 0
    if (reps <= 0) continue
    const v = charge ? parseFloat(set.weight) || 0 : reps
    if (v > best) best = v
  }
  return best
}

function unitOf(id) {
  const metric = getMetric(id)
  if (metric === 'charge') return 'kg'
  if (metric === 'temps') return findExerciseById(id)?.unit === 'min' ? 'min' : 's'
  return 'reps'
}

export function buildCoachSummary(sessions, { weeks = 8, now = Date.now() } = {}) {
  const since = now - weeks * WEEK_MS
  const period = (sessions ?? [])
    .filter((s) => s.endedAt && s.entries?.length && new Date(s.startedAt).getTime() >= since)
    .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt))

  if (period.length === 0) {
    return { vide: true, semaines: weeks }
  }

  // --- Stats globales ---
  const durations = period.map((s) => (new Date(s.endedAt) - new Date(s.startedAt)) / 60000)
  const dureeMoyenneMin = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
  const semainesActives = new Set(period.map((s) => weekKey(s.startedAt))).size
  const rpes = period.map((s) => s.rpe).filter((r) => typeof r === 'number')
  const rpeMoyen = rpes.length ? +(rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : null

  // --- Volume par groupe musculaire ---
  const groupStats = {} // group -> { sets, volumeKg, seances:Set }
  for (const s of period) {
    for (const e of s.entries) {
      const group = findExerciseById(e.exerciseId)?.group ?? 'divers'
      const g = (groupStats[group] ??= { sets: 0, volumeKg: 0, seances: new Set() })
      let touched = false
      for (const set of e.sets) {
        if (!isCounted(set)) continue
        const reps = parseFloat(set.reps) || 0
        if (reps <= 0) continue
        g.sets += 1
        touched = true
        if (getMetric(e.exerciseId) === 'charge') {
          g.volumeKg += reps * (parseFloat(set.weight) || 0)
        }
      }
      if (touched) g.seances.add(s.id)
    }
  }
  const volumeParGroupe = STRENGTH_GROUPS
    .map((key) => ({
      groupe: GROUPS[key]?.label ?? key,
      sets: groupStats[key]?.sets ?? 0,
      volumeKg: Math.round(groupStats[key]?.volumeKg ?? 0),
      seances: groupStats[key]?.seances.size ?? 0,
    }))
    .sort((a, b) => b.sets - a.sets)
  const groupesNegliges = volumeParGroupe.filter((g) => g.sets === 0).map((g) => g.groupe)

  // --- Progression par exercice (les plus pratiqués) ---
  const perExo = {} // id -> [{ t, best }]
  for (const s of period) {
    for (const e of s.entries) {
      const best = bestOfEntry(e)
      if (best > 0) (perExo[e.exerciseId] ??= []).push({ t: new Date(s.startedAt).getTime(), best })
    }
  }
  const progression = Object.entries(perExo)
    .filter(([, arr]) => arr.length >= 2)
    .map(([id, arr]) => {
      arr.sort((a, b) => a.t - b.t)
      const debut = arr[0].best
      const actuel = arr[arr.length - 1].best
      return {
        exo: findExerciseById(id)?.name ?? id,
        seances: arr.length,
        debut,
        actuel,
        unite: unitOf(id),
        tendance: actuel > debut ? 'progresse' : actuel < debut ? 'baisse' : 'stable',
      }
    })
    .sort((a, b) => b.seances - a.seances)
    .slice(0, 8)

  return {
    semaines: weeks,
    totalSeances: period.length,
    semainesActives, // sur combien des `weeks` semaines il s'est entraîné
    dureeMoyenneMin,
    rpeMoyen,
    volumeParGroupe,
    groupesNegliges,
    progression,
  }
}
