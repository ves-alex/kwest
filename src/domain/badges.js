import { Droplet, Hammer, Sunrise, TrendingUp, Zap } from 'lucide-react'

const DAY_MS = 86400000

// Helper : meilleur (poids × reps) par exercice dans une liste de séances
function bestVolumeByExercise(sessions) {
  const best = {}
  for (const s of sessions) {
    for (const e of s.entries) {
      for (const set of e.sets) {
        const reps = parseFloat(set.reps) || 0
        const weight = parseFloat(set.weight) || 0
        const score = reps * weight
        if (score > 0) {
          best[e.exerciseId] = Math.max(best[e.exerciseId] ?? 0, score)
        }
      }
    }
  }
  return best
}

export const BADGES = [
  {
    id: 'premier-sang',
    name: 'Premier Sang',
    description: 'Tu as terminé ta première séance.',
    Icon: Droplet,
    condition: (_player, sessions) => sessions.length >= 1,
  },
  {
    id: 'forge-douleur',
    name: 'Forgé dans la douleur',
    description: 'Une séance avec 5 exercices ou plus.',
    Icon: Hammer,
    condition: (_player, sessions) =>
      sessions.some((s) => s.entries.length >= 5),
  },
  {
    id: 'retour-guerrier',
    name: 'Retour du Guerrier',
    description: 'Une reprise après 7 jours ou plus de pause.',
    Icon: Sunrise,
    condition: (_player, sessions) => {
      const sorted = [...sessions].sort(
        (a, b) => new Date(a.startedAt) - new Date(b.startedAt)
      )
      for (let i = 1; i < sorted.length; i++) {
        const gap =
          (new Date(sorted[i].startedAt) - new Date(sorted[i - 1].startedAt)) /
          DAY_MS
        if (gap >= 7) return true
      }
      return false
    },
  },
  {
    id: 'corps-souvient',
    name: 'Le Corps se souvient',
    description: 'Tu as battu un record (poids × reps) sur un exercice.',
    Icon: TrendingUp,
    condition: (_player, sessions) => {
      if (sessions.length < 2) return false
      const sorted = [...sessions].sort(
        (a, b) => new Date(a.startedAt) - new Date(b.startedAt)
      )
      for (let i = 1; i < sorted.length; i++) {
        const before = sorted.slice(0, i)
        const bestBefore = bestVolumeByExercise(before)
        for (const e of sorted[i].entries) {
          const prev = bestBefore[e.exerciseId] ?? 0
          for (const set of e.sets) {
            const reps = parseFloat(set.reps) || 0
            const weight = parseFloat(set.weight) || 0
            const score = reps * weight
            if (score > 0 && score > prev) return true
          }
        }
      }
      return false
    },
  },
  {
    id: 'maitre-momentum',
    name: 'Maître du Momentum',
    description: '3 séances dans une fenêtre de 7 jours.',
    Icon: Zap,
    condition: (_player, sessions) => {
      if (sessions.length < 3) return false
      const sorted = sessions
        .map((s) => new Date(s.startedAt).getTime())
        .sort((a, b) => a - b)
      for (let i = 0; i <= sorted.length - 3; i++) {
        if (sorted[i + 2] - sorted[i] <= 7 * DAY_MS) return true
      }
      return false
    },
  },
]

export function findBadgeById(id) {
  return BADGES.find((b) => b.id === id) ?? null
}

// Retourne la liste des IDs de badges débloqués
export function evaluateBadges(player, sessions) {
  return BADGES.filter((b) => b.condition(player, sessions)).map((b) => b.id)
}
