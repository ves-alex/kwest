import { getDifficulty, getBodyweightFactor } from './exercises'

// --- Monnaie : Runes d'Effort ---

const DIVISOR = 50
const MAX_SET_RUNES = 30    // plafond par série (un vrai 5RM lourd ≈ 14 runes)
const MAX_SESSION_RUNES = 400  // plafond par séance

// Runes gagnées pour une série
// - Avec poids : floor(poids × reps × difficulté / 50), plafonné à MAX_SET_RUNES
// - Sans poids (poids du corps) : floor(reps × bodyweightFactor)
export function computeSetRunes(set, exerciseId) {
  const reps = parseFloat(set.reps) || 0
  const weight = parseFloat(set.weight) || 0
  if (reps === 0) return 0

  if (weight > 0) {
    const raw = Math.floor((weight * reps * getDifficulty(exerciseId)) / DIVISOR)
    return Math.min(raw, MAX_SET_RUNES)
  }
  return Math.floor(reps * getBodyweightFactor(exerciseId))
}

export function computeSessionRunes(session) {
  if (!session?.entries) return 0
  const total = session.entries.reduce((total, entry) => {
    const sub = entry.sets.reduce(
      (acc, set) => acc + computeSetRunes(set, entry.exerciseId),
      0
    )
    return total + sub
  }, 0)
  return Math.min(total, MAX_SESSION_RUNES)
}

// --- Progression : XP & Niveau ---

// XP gagné en terminant une séance : base + bonus volume
// 10 base + 2 par exo + 0.5 par set
export function computeSessionXp(session) {
  if (!session?.entries) return 0
  const exos = session.entries.length
  const sets = session.entries.reduce((acc, e) => acc + e.sets.length, 0)
  return 10 + exos * 2 + Math.floor(sets / 2)
}

// Niveaux et titres "Forge nocturne"
const LEVELS = [
  { min: 0, title: 'Initié' },
  { min: 30, title: 'Disciple' },
  { min: 100, title: 'Forgeron' },
  { min: 250, title: 'Maître-forgeron' },
  { min: 500, title: 'Sage de la Forge' },
  { min: 800, title: 'Légende vivante' },
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
