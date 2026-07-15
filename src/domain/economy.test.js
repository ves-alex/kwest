import { describe, it, expect } from 'vitest'
import {
  computeSetRunes,
  computeSessionRunes,
  computeSessionXp,
  computeLevel,
  computeTimerRunes,
  computeTimerXp,
  recomputeTotalsFromSessions,
} from './economy'

// Raccourci fixture : une séance terminée d'une heure
function session(entries, { startedAt = '2026-07-01T10:00:00', endedAt = '2026-07-01T11:00:00' } = {}) {
  return { id: 's-test', startedAt, endedAt, entries }
}

describe('computeSetRunes', () => {
  it('charge avec poids : poids × reps × difficulté / 50, arrondi bas', () => {
    // developpe-couche-barre → difficulté 1.4 : 100 × 10 × 1.4 / 50 = 28
    expect(computeSetRunes({ reps: '10', weight: '100' }, 'developpe-couche-barre')).toBe(28)
    // leg-extension → difficulté 1.0 : 50 × 10 / 50 = 10
    expect(computeSetRunes({ reps: '10', weight: '50' }, 'leg-extension')).toBe(10)
  })

  it('plafonne une série à 30 runes', () => {
    // 250 × 10 × 1.4 / 50 = 70 → 30
    expect(computeSetRunes({ reps: '10', weight: '250' }, 'developpe-couche-barre')).toBe(30)
  })

  it('charge sans lest : bascule sur le facteur poids du corps', () => {
    // tractions (charge) à vide → 5 × 4 = 20
    expect(computeSetRunes({ reps: '5', weight: '' }, 'tractions')).toBe(20)
  })

  it('metric reps : valeur × facteur', () => {
    // pompes → 10 × 1.5 = 15
    expect(computeSetRunes({ reps: '10', weight: '' }, 'pompes')).toBe(15)
  })

  it('metric temps : plafonné aussi à 30', () => {
    // planche → 45 s × 1 = 45 → 30
    expect(computeSetRunes({ reps: '45', weight: '' }, 'planche')).toBe(30)
  })

  it('0 rep → 0 rune', () => {
    expect(computeSetRunes({ reps: '', weight: '100' }, 'developpe-couche-barre')).toBe(0)
    expect(computeSetRunes({ reps: '0', weight: '100' }, 'developpe-couche-barre')).toBe(0)
  })
})

describe('computeSessionRunes', () => {
  it('exclut les sets validated:false, compte true et undefined (rétro-compat)', () => {
    const s = session([
      {
        exerciseId: 'leg-extension',
        sets: [
          { reps: '10', weight: '50', validated: true },   // 10
          { reps: '10', weight: '50', validated: false },  // exclu
          { reps: '10', weight: '50' },                    // 10 (ancienne session)
        ],
      },
    ])
    expect(computeSessionRunes(s)).toBe(20)
  })

  it('plafonne la séance à 400 runes', () => {
    const sets = Array.from({ length: 20 }, () => ({ reps: '10', weight: '250', validated: true }))
    const s = session([{ exerciseId: 'developpe-couche-barre', sets }]) // 20 × 30 = 600
    expect(computeSessionRunes(s)).toBe(400)
  })

  it('séance vide ou malformée → 0', () => {
    expect(computeSessionRunes(null)).toBe(0)
    expect(computeSessionRunes({})).toBe(0)
    expect(computeSessionRunes(session([]))).toBe(0)
  })
})

describe('computeSessionXp', () => {
  it('10 base + 2 par exo travaillé + 1 par paire de sets comptés', () => {
    const s = session([
      { exerciseId: 'a', sets: [{ reps: '10', validated: true }, { reps: '10', validated: true }] },
      { exerciseId: 'b', sets: [{ reps: '10', validated: true }, { reps: '10', validated: true }, { reps: '10', validated: true }] },
    ])
    // 10 + 2×2 + floor(5/2) = 16
    expect(computeSessionXp(s)).toBe(16)
  })

  it("un exo dont aucun set n'est validé ne compte pas", () => {
    const s = session([
      { exerciseId: 'a', sets: [{ reps: '10', validated: false }] },
    ])
    expect(computeSessionXp(s)).toBe(10) // base seule
  })
})

describe('computeLevel', () => {
  it('bornes des paliers', () => {
    expect(computeLevel(0)).toMatchObject({ level: 0, title: 'Initié', nextThreshold: 30 })
    expect(computeLevel(29).level).toBe(0)
    expect(computeLevel(30)).toMatchObject({ level: 1, title: 'Disciple' })
  })

  it('palier ultime : progress 1, pas de suivant', () => {
    const max = computeLevel(6000)
    expect(max).toMatchObject({ level: 9, title: "L'Ascendant", nextThreshold: null, nextTitle: null })
    expect(max.progress).toBe(1)
  })

  it('progress borné entre 0 et 1', () => {
    const l = computeLevel(15) // mi-chemin Initié → Disciple
    expect(l.progress).toBeCloseTo(0.5)
  })
})

describe('computeTimerRunes / computeTimerXp', () => {
  it('3 runes et 2 xp par minute, minimum 1', () => {
    expect(computeTimerRunes(10)).toBe(30)
    expect(computeTimerXp(10)).toBe(20)
    expect(computeTimerRunes(0.1)).toBe(1)
    expect(computeTimerXp(0.1)).toBe(1)
  })
})

describe('recomputeTotalsFromSessions', () => {
  it('ignore les séances non clôturées', () => {
    const active = { id: 'a', startedAt: '2026-07-01T10:00:00', endedAt: null, entries: [] }
    expect(recomputeTotalsFromSessions([active])).toEqual({ runes: 0, xp: 0 })
  })

  it('timer-only : gains à la minute, sous 5 min → rien', () => {
    const courte = session([], { endedAt: '2026-07-01T10:03:00' }) // 3 min
    const longue = session([], { endedAt: '2026-07-01T10:10:00' }) // 10 min
    expect(recomputeTotalsFromSessions([courte])).toEqual({ runes: 0, xp: 0 })
    expect(recomputeTotalsFromSessions([longue])).toEqual({ runes: 30, xp: 20 })
  })

  it('somme les séances normales', () => {
    const s = session([
      { exerciseId: 'developpe-couche-barre', sets: [{ reps: '10', weight: '100', validated: true }] },
    ])
    // runes 28 · xp = 10 + 2 + floor(1/2) = 12
    expect(recomputeTotalsFromSessions([s])).toEqual({ runes: 28, xp: 12 })
  })
})
