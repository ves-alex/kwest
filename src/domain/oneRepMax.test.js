import { describe, it, expect } from 'vitest'
import { estimate1RM, bestOneRepMax, sessionOneRepMax } from './oneRepMax'

describe('estimate1RM', () => {
  it('une seule rep = le poids lui-même (à l\'arrondi près)', () => {
    expect(estimate1RM(100, 1)).toBe(103) // Epley majore déjà à 1 rep
  })

  it('capte la progression à poids égal', () => {
    expect(estimate1RM(80, 8)).toBeGreaterThan(estimate1RM(80, 5))
  })

  it('accepte les strings du storage', () => {
    expect(estimate1RM('80', '5')).toBe(estimate1RM(80, 5))
  })

  it('ignore les séries au-delà de 12 reps (endurance, pas force max)', () => {
    expect(estimate1RM(40, 13)).toBe(0)
    expect(estimate1RM(40, 12)).toBeGreaterThan(0)
  })

  it('ignore les séries sans poids ou sans reps', () => {
    expect(estimate1RM(0, 10)).toBe(0)
    expect(estimate1RM(80, 0)).toBe(0)
    expect(estimate1RM('', '')).toBe(0)
  })
})

describe('bestOneRepMax', () => {
  it('retient le meilleur set, pas le plus lourd', () => {
    // 60×10 = 80 estimé, contre 70×5 = 82 : c'est le second qui gagne
    expect(bestOneRepMax([{ weight: '60', reps: '10' }, { weight: '70', reps: '5' }])).toBe(82)
  })

  it('aucune série exploitable → 0', () => {
    expect(bestOneRepMax([{ weight: '', reps: '30' }])).toBe(0)
    expect(bestOneRepMax([])).toBe(0)
  })
})

describe('sessionOneRepMax', () => {
  it('agrège les entries dupliquées et ignore les sets non validés', () => {
    const session = {
      entries: [
        { exerciseId: 'squat-barre', sets: [{ weight: '100', reps: '5' }] },
        { exerciseId: 'squat-barre', sets: [{ weight: '200', reps: '1', validated: false }] },
      ],
    }
    expect(sessionOneRepMax(session, 'squat-barre')).toBe(117)
  })
})
