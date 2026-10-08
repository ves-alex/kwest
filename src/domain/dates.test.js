import { describe, it, expect } from 'vitest'
import { dayKey, weekIndex } from './dates'

// Ces fonctions travaillent en heure locale : la CI les rejoue en UTC et en
// TZ=Europe/Paris, où toISOString() et les semaines de 7 × 24 h se trompent.

describe('dayKey', () => {
  it('donne le jour local, même juste après minuit', () => {
    expect(dayKey(new Date(2026, 9, 7, 0, 30))).toBe('2026-10-07')
    expect(dayKey(new Date(2026, 9, 7, 23, 59))).toBe('2026-10-07')
  })

  it('complète mois et jour sur deux chiffres', () => {
    expect(dayKey(new Date(2027, 0, 5, 12))).toBe('2027-01-05')
  })
})

describe('weekIndex', () => {
  it('même numéro du lundi 00:00 au dimanche 23:59', () => {
    const lundi = weekIndex(new Date(2026, 9, 5, 0, 0))
    expect(weekIndex(new Date(2026, 9, 7, 12))).toBe(lundi)
    expect(weekIndex(new Date(2026, 9, 11, 23, 59))).toBe(lundi)
    expect(weekIndex(new Date(2026, 9, 12, 0, 0))).toBe(lundi + 1)
  })

  it("semaines consécutives à travers le passage à l'heure d'hiver (25/10/2026)", () => {
    const avant = weekIndex(new Date(2026, 9, 21, 10))
    expect(weekIndex(new Date(2026, 9, 25, 23, 30))).toBe(avant)
    expect(weekIndex(new Date(2026, 9, 26, 8))).toBe(avant + 1)
  })

  it("semaines consécutives à travers le passage à l'heure d'été (28/03/2027)", () => {
    const avant = weekIndex(new Date(2027, 2, 24, 10))
    expect(weekIndex(new Date(2027, 2, 28, 23, 30))).toBe(avant)
    expect(weekIndex(new Date(2027, 2, 29, 8))).toBe(avant + 1)
  })

  it('accepte une date ISO comme celles des séances', () => {
    expect(weekIndex('2026-10-28T10:00:00')).toBe(weekIndex(new Date(2026, 9, 26, 0, 0)))
  })
})
