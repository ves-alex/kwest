import { describe, it, expect } from 'vitest'
import { BADGES, findBadgeById, evaluateBadges } from './badges'

const PLAYER = { totalRunes: 0, cosmeticsOwned: [] }

function s(startedAt, entries = [], extra = {}) {
  return { id: startedAt, startedAt, endedAt: startedAt, entries, ...extra }
}

function has(ids, badgeId) {
  return ids.includes(badgeId)
}

describe('conditions des badges', () => {
  it('premier-sang : dès la première séance', () => {
    expect(has(evaluateBadges(PLAYER, []), 'premier-sang')).toBe(false)
    expect(has(evaluateBadges(PLAYER, [s('2026-07-01T10:00:00')]), 'premier-sang')).toBe(true)
  })

  it('forge-douleur : une séance à 5 exercices ou plus', () => {
    const cinqExos = Array.from({ length: 5 }, (_, i) => ({ exerciseId: `exo-${i}`, sets: [] }))
    expect(has(evaluateBadges(PLAYER, [s('2026-07-01T10:00:00', cinqExos)]), 'forge-douleur')).toBe(true)
    expect(has(evaluateBadges(PLAYER, [s('2026-07-01T10:00:00', cinqExos.slice(0, 4))]), 'forge-douleur')).toBe(false)
  })

  it('maitre-momentum : 3 séances dans une fenêtre de 7 jours', () => {
    const serrees = [s('2026-07-01T10:00:00'), s('2026-07-03T10:00:00'), s('2026-07-07T10:00:00')]
    const espacees = [s('2026-07-01T10:00:00'), s('2026-07-10T10:00:00'), s('2026-07-20T10:00:00')]
    expect(has(evaluateBadges(PLAYER, serrees), 'maitre-momentum')).toBe(true)
    expect(has(evaluateBadges(PLAYER, espacees), 'maitre-momentum')).toBe(false)
  })

  it('retour-guerrier : reprise après 7 jours ou plus de pause', () => {
    const avecPause = [s('2026-06-01T10:00:00'), s('2026-06-15T10:00:00')]
    expect(has(evaluateBadges(PLAYER, avecPause), 'retour-guerrier')).toBe(true)
  })

  it('dix-mille-kilos : volume total cumulé', () => {
    // 10 sets de 10 reps × 100 kg = 10 000 kg pile
    const sets = Array.from({ length: 10 }, () => ({ reps: '10', weight: '100' }))
    const sessions = [s('2026-07-01T10:00:00', [{ exerciseId: 'a', sets }])]
    expect(has(evaluateBadges(PLAYER, sessions), 'dix-mille-kilos')).toBe(true)
  })

  it("lendurant : séance d'au moins 60 minutes", () => {
    const longue = s('2026-07-01T10:00:00', [], { endedAt: '2026-07-01T11:00:00' })
    const courte = s('2026-07-02T10:00:00', [], { endedAt: '2026-07-02T10:45:00' })
    expect(has(evaluateBadges(PLAYER, [longue]), 'lendurant')).toBe(true)
    expect(has(evaluateBadges(PLAYER, [courte]), 'lendurant')).toBe(false)
  })

  it('tresor-de-la-forge : 1 000 runes cumulées (état player)', () => {
    expect(has(evaluateBadges({ ...PLAYER, totalRunes: 1000 }, []), 'tresor-de-la-forge')).toBe(true)
    expect(has(evaluateBadges({ ...PLAYER, totalRunes: 999 }, []), 'tresor-de-la-forge')).toBe(false)
  })

  it('premier-or-forge : un achat au-delà du skin offert', () => {
    expect(has(evaluateBadges({ ...PLAYER, cosmeticsOwned: ['skin-m1'] }, []), 'premier-or-forge')).toBe(false)
    expect(has(evaluateBadges({ ...PLAYER, cosmeticsOwned: ['skin-m1', 'aura-ember'] }, []), 'premier-or-forge')).toBe(true)
  })
})

describe('intégrité du catalogue de badges', () => {
  it('ids uniques et findBadgeById cohérent', () => {
    const ids = BADGES.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(findBadgeById(id)?.id).toBe(id)
    }
    expect(findBadgeById('inexistant')).toBeNull()
  })

  it('chaque badge a nom, description, icône et condition', () => {
    for (const b of BADGES) {
      expect(b.name).toBeTruthy()
      expect(b.description).toBeTruthy()
      expect(b.Icon).toBeTruthy()
      expect(typeof b.condition).toBe('function')
    }
  })
})
