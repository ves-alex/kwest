import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { computeWeeklyStats } from './streak'

// On fige "maintenant" un mercredi pour des semaines déterministes.
// Semaine courante : lundi 2026-07-13 → dimanche 2026-07-19.
const NOW = new Date('2026-07-15T12:00:00')

function s(startedAt) {
  return { id: startedAt, startedAt, entries: [] }
}

describe('computeWeeklyStats', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('compte les séances de la semaine courante (lundi → dimanche)', () => {
    const stats = computeWeeklyStats([
      s('2026-07-13T08:00:00'), // lundi courant
      s('2026-07-14T19:00:00'), // mardi courant
      s('2026-07-12T10:00:00'), // dimanche de la semaine passée
    ])
    expect(stats.weekSessions).toBe(2)
  })

  it('chaîne : semaines actives consécutives incluant la courante', () => {
    const stats = computeWeeklyStats([
      s('2026-07-14T10:00:00'), // semaine courante
      s('2026-07-08T10:00:00'), // semaine -1
      s('2026-07-01T10:00:00'), // semaine -2
    ])
    expect(stats.streak).toBe(3)
  })

  it("grâce d'une semaine : la courante vide ne casse pas si la précédente est active", () => {
    const stats = computeWeeklyStats([s('2026-07-08T10:00:00')]) // semaine -1 seulement
    expect(stats.streak).toBe(1)
  })

  it('deux semaines vides = chaîne cassée', () => {
    const stats = computeWeeklyStats([s('2026-07-01T10:00:00')]) // semaine -2 seulement
    expect(stats.streak).toBe(0)
  })

  it('record all-time indépendant de la chaîne courante', () => {
    const stats = computeWeeklyStats([
      // 3 semaines consécutives en juin, puis plus rien
      s('2026-06-01T10:00:00'),
      s('2026-06-10T10:00:00'),
      s('2026-06-17T10:00:00'),
    ])
    expect(stats.recordStreak).toBe(3)
    expect(stats.streak).toBe(0)
  })

  it('aucune séance → tout à zéro', () => {
    expect(computeWeeklyStats([])).toEqual({ weekSessions: 0, streak: 0, recordStreak: 0 })
  })
})
