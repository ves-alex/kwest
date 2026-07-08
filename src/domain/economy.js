import { getDifficulty, getBodyweightFactor, getMetric } from './exercises'

// --- Monnaie : Runes d'Effort ---

const DIVISOR = 50
const MAX_SET_RUNES = 30    // plafond par série (un vrai 5RM lourd ≈ 14 runes)
const MAX_SESSION_RUNES = 400  // plafond par séance

// Runes gagnées pour une série. `set.reps` porte la valeur principale : nombre de
// répétitions, ou durée (sec/min) pour un exo 'temps'.
// - Charge avec poids : floor(poids × reps × difficulté / 50), plafonné à MAX_SET_RUNES
// - Sinon (reps seules, temps, ou charge sans lest) : floor(valeur × bodyweightFactor)
export function computeSetRunes(set, exerciseId) {
  const primary = parseFloat(set.reps) || 0
  if (primary === 0) return 0

  const weight = parseFloat(set.weight) || 0
  if (getMetric(exerciseId) === 'charge' && weight > 0) {
    const raw = Math.floor((weight * primary * getDifficulty(exerciseId)) / DIVISOR)
    return Math.min(raw, MAX_SET_RUNES)
  }
  return Math.min(Math.floor(primary * getBodyweightFactor(exerciseId)), MAX_SET_RUNES)
}

// Un set compte s'il est explicitement validé (true) OU d'une ancienne session sans le champ (undefined).
// Seul `validated: false` (nouveau + pas validé) est exclu.
function isCounted(set) {
  return set.validated !== false
}

export function computeSessionRunes(session) {
  if (!session?.entries) return 0
  const total = session.entries.reduce((total, entry) => {
    const sub = entry.sets.reduce(
      (acc, set) => (isCounted(set) ? acc + computeSetRunes(set, entry.exerciseId) : acc),
      0
    )
    return total + sub
  }, 0)
  return Math.min(total, MAX_SESSION_RUNES)
}

// --- Progression : XP & Niveau ---

// XP gagné en terminant une séance : base + bonus volume
// 10 base + 2 par exo (avec ≥ 1 set compté) + 0.5 par set compté
export function computeSessionXp(session) {
  if (!session?.entries) return 0
  const exosWithSet = session.entries.filter((e) => e.sets.some(isCounted)).length
  const validSets = session.entries.reduce(
    (acc, e) => acc + e.sets.filter(isCounted).length,
    0
  )
  return 10 + exosWithSet * 2 + Math.floor(validSets / 2)
}

// Niveaux et titres "Forge nocturne"
const LEVELS = [
  { min: 0,    title: 'Initié' },
  { min: 30,   title: 'Disciple' },
  { min: 100,  title: 'Forgeron' },
  { min: 250,  title: 'Maître-forgeron' },
  { min: 500,  title: 'Sage de la Forge' },
  { min: 800,  title: 'Légende vivante' },
  { min: 1500, title: 'Gardien de la Flamme' },
  { min: 2500, title: "Porteur de l'Enclume" },
  { min: 4000, title: "L'Immuable" },
  { min: 6000, title: "L'Ascendant" },
]

export function computeLevel(xp) {
  const currentIndex = LEVELS.reduce(
    (acc, l, i) => (xp >= l.min ? i : acc),
    0
  )
  const current = LEVELS[currentIndex]
  const next = LEVELS[currentIndex + 1] ?? null
  const progress = next
    ? (xp - current.min) / (next.min - current.min)
    : 1
  return {
    level: currentIndex,
    title: current.title,
    currentMin: current.min,
    nextThreshold: next?.min ?? null,
    nextTitle: next?.title ?? null,
    progress: Math.max(0, Math.min(1, progress)),
  }
}

// Runes et XP pour une séance sans exercices (timer only) — 3 runes/min, 2 xp/min
export function computeTimerRunes(minutes) {
  return Math.max(1, Math.floor(minutes * 3))
}
export function computeTimerXp(minutes) {
  return Math.max(1, Math.floor(minutes * 2))
}

export const RUNE_SYMBOL = "◈"
export const RUNE_NAME = "Runes d’Effort"

// Recalcule totalRunes/totalXp attendus à partir de l'historique complet.
// Utilisé pour détecter une édition manuelle de localStorage (anti-triche faible).
export function recomputeTotalsFromSessions(sessions) {
  let runes = 0
  let xp = 0
  for (const s of sessions) {
    if (!s.endedAt) continue // séance non clôturée ignorée
    const isTimerOnly = !s.entries || s.entries.length === 0
    const durationMin = (new Date(s.endedAt) - new Date(s.startedAt)) / 60000
    if (isTimerOnly) {
      if (durationMin < 5) continue // seuil "abandonnée"
      runes += computeTimerRunes(durationMin)
      xp += computeTimerXp(durationMin)
    } else {
      runes += computeSessionRunes(s)
      xp += computeSessionXp(s)
    }
  }
  return { runes, xp }
}
