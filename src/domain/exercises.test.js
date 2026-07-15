import { describe, it, expect } from 'vitest'
import {
  EXERCISES,
  GROUPS,
  EQUIPMENT,
  METRICS,
  exercisesByGroup,
  findExerciseById,
  getMetric,
  getMetricUnit,
  getDifficulty,
  getBodyweightFactor,
} from './exercises'

// Tests d'intégrité du catalogue : attrapent les fautes de frappe au moment
// où on ajoute un exercice (id dupliqué, groupe inconnu, unité manquante…).
describe('intégrité du catalogue', () => {
  it('ids uniques', () => {
    const ids = EXERCISES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('chaque exo référence un groupe et un équipement connus', () => {
    for (const e of EXERCISES) {
      expect(GROUPS[e.group], `groupe inconnu pour ${e.id}`).toBeTruthy()
      expect(EQUIPMENT[e.equipment], `équipement inconnu pour ${e.id}`).toBeTruthy()
    }
  })

  it('metric valide, et unit obligatoire (sec|min) uniquement pour temps', () => {
    for (const e of EXERCISES) {
      if (e.metric) expect(METRICS[e.metric], `metric inconnue pour ${e.id}`).toBeTruthy()
      if (e.metric === 'temps') {
        expect(['sec', 'min'], `unit manquante pour ${e.id}`).toContain(e.unit)
      } else {
        expect(e.unit, `unit inattendue pour ${e.id}`).toBeUndefined()
      }
    }
  })

  it('chaque exo a un nom non vide', () => {
    for (const e of EXERCISES) {
      expect(e.name?.trim(), `nom vide pour ${e.id}`).toBeTruthy()
    }
  })
})

describe('helpers', () => {
  it('exercisesByGroup : couvre tout le catalogue, dans l’ordre des groupes', () => {
    const groups = exercisesByGroup()
    const total = groups.reduce((acc, g) => acc + g.exercises.length, 0)
    expect(total).toBe(EXERCISES.length)
    const orders = groups.map((g) => GROUPS[g.key].order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })

  it('findExerciseById / getMetric / getMetricUnit', () => {
    expect(findExerciseById('presse-pectoraux')?.group).toBe('poitrine')
    expect(findExerciseById('inconnu')).toBeUndefined()
    expect(getMetric('developpe-couche-barre')).toBe('charge') // défaut
    expect(getMetric('pompes')).toBe('reps')
    expect(getMetric('planche')).toBe('temps')
    expect(getMetricUnit('planche')).toBe('sec')
    expect(getMetricUnit('rameur')).toBe('min')
    expect(getMetricUnit('pompes')).toBeNull()
  })

  it('getDifficulty : override ou 1.0 par défaut', () => {
    expect(getDifficulty('developpe-couche-barre')).toBe(1.4)
    expect(getDifficulty('presse-pectoraux')).toBe(1.2)
    expect(getDifficulty('leg-extension')).toBe(1.0)
  })

  it('getBodyweightFactor : facteur ou 1 par défaut', () => {
    expect(getBodyweightFactor('pompes')).toBe(1.5)
    expect(getBodyweightFactor('exo-inconnu')).toBe(1)
  })
})
