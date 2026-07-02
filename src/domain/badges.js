import { Droplet, Hammer, Sunrise, TrendingUp, Zap, Calendar, Mountain, Target, ShoppingBag, Timer, Coins } from 'lucide-react'

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
  {
    id: 'semaine-apres-semaine',
    name: 'Semaine après semaine',
    description: '4 semaines consécutives avec au moins une séance.',
    Icon: Calendar,
    condition: (_player, sessions) => {
      const weekSet = new Set()
      for (const s of sessions) {
        const d = new Date(s.startedAt)
        const monday = new Date(d)
        monday.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1))
        monday.setHours(0, 0, 0, 0)
        weekSet.add(monday.getTime())
      }
      const weeks = [...weekSet].sort((a, b) => a - b)
      let streak = 1
      for (let i = 1; i < weeks.length; i++) {
        if (weeks[i] - weeks[i - 1] === 7 * DAY_MS) {
          streak++
          if (streak >= 4) return true
        } else {
          streak = 1
        }
      }
      return false
    },
  },
  {
    id: 'dix-mille-kilos',
    name: 'Dix mille kilos',
    description: '10 000 kg soulevés au total, toutes séances confondues.',
    Icon: Mountain,
    condition: (_player, sessions) => {
      let total = 0
      for (const s of sessions) {
        for (const e of s.entries) {
          for (const set of e.sets) {
            total += (parseFloat(set.reps) || 0) * (parseFloat(set.weight) || 0)
            if (total >= 10000) return true
          }
        }
      }
      return false
    },
  },
  {
    id: 'lobsede',
    name: "L'Obsédé",
    description: '20 séances différentes contenant le même exercice.',
    Icon: Target,
    condition: (_player, sessions) => {
      const counts = {}
      for (const s of sessions) {
        const seen = new Set()
        for (const e of s.entries) {
          if (!seen.has(e.exerciseId)) {
            counts[e.exerciseId] = (counts[e.exerciseId] ?? 0) + 1
            if (counts[e.exerciseId] >= 20) return true
            seen.add(e.exerciseId)
          }
        }
      }
      return false
    },
  },
  {
    id: 'premier-or-forge',
    name: 'Premier or forgé',
    description: "Acheter un cosmétique à l'Atelier.",
    Icon: ShoppingBag,
    condition: (player) => (player.cosmeticsOwned ?? []).length > 1,
  },
  {
    id: 'lendurant',
    name: "L'Endurant",
    description: "Terminer une séance d'au moins 60 minutes.",
    Icon: Timer,
    condition: (_player, sessions) =>
      sessions.some(
        (s) => s.endedAt && new Date(s.endedAt) - new Date(s.startedAt) >= 60 * 60000
      ),
  },
  {
    id: 'tresor-de-la-forge',
    name: 'Trésor de la Forge',
    description: '1 000 runes gagnées au total.',
    Icon: Coins,
    condition: (player) => (player.totalRunes ?? 0) >= 1000,
  },
]

export function findBadgeById(id) {
  return BADGES.find((b) => b.id === id) ?? null
}

// Retourne la liste des IDs de badges débloqués
export function evaluateBadges(player, sessions) {
  return BADGES.filter((b) => b.condition(player, sessions)).map((b) => b.id)
}
