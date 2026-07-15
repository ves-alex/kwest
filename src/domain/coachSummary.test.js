import { describe, it, expect } from 'vitest'
import { buildCoachSummary } from './coachSummary'

// "maintenant" injecté via l'option now — pas besoin de fake timers ici.
const NOW = new Date('2026-07-15T12:00:00').getTime()
const opts = { now: NOW }

function session(startedAt, endedAt, entries, extra = {}) {
  return { id: startedAt, startedAt, endedAt, entries, ...extra }
}

describe('buildCoachSummary', () => {
  it('vide sans séance exploitable', () => {
    expect(buildCoachSummary([], opts)).toEqual({ vide: true })
    // non clôturée ou sans exercice → ignorée
    const active = session('2026-07-14T10:00:00', null, [{ exerciseId: 'pompes', sets: [] }])
    const timerOnly = session('2026-07-14T10:00:00', '2026-07-14T11:00:00', [])
    expect(buildCoachSummary([active, timerOnly], opts)).toEqual({ vide: true })
  })

  it('ignore les séances hors fenêtre (8 semaines par défaut)', () => {
    const vieille = session('2026-01-05T10:00:00', '2026-01-05T11:00:00', [
      { exerciseId: 'pompes', sets: [{ reps: '10', validated: true }] },
    ])
    expect(buildCoachSummary([vieille], opts)).toEqual({ vide: true })
  })

  it('agrège stats globales, volume par groupe et progression', () => {
    const s1 = session('2026-07-06T10:00:00', '2026-07-06T11:00:00', [
      { exerciseId: 'developpe-couche-barre', sets: [{ reps: '10', weight: '80', validated: true }] },
    ], { rpe: 3 })
    const s2 = session('2026-07-13T10:00:00', '2026-07-13T10:30:00', [
      { exerciseId: 'developpe-couche-barre', sets: [{ reps: '10', weight: '90', validated: true }] },
      { exerciseId: 'squat-barre', sets: [{ reps: '5', weight: '100', validated: true }] },
    ])

    const r = buildCoachSummary([s1, s2], opts)

    expect(r.semainesAnalysees).toBe(2) // lundi 06/07 → lundi 13/07
    expect(r.totalSeances).toBe(2)
    expect(r.semainesActives).toBe(2)
    expect(r.dureeMoyenneMin).toBe(45) // (60 + 30) / 2
    expect(r.rpeMoyen).toBe(3)

    const poitrine = r.volumeParGroupe.find((g) => g.groupe === 'Poitrine')
    expect(poitrine).toMatchObject({ sets: 2, volumeKg: 1700, seances: 2 })
    expect(r.groupesNegliges).toContain('Dos')
    expect(r.groupesNegliges).not.toContain('Poitrine')

    // progression : seulement les exos vus ≥ 2 fois
    expect(r.progression).toHaveLength(1)
    expect(r.progression[0]).toMatchObject({
      seances: 2,
      debut: 80,
      actuel: 90,
      unite: 'kg',
      tendance: 'progresse',
    })
  })

  it('les sets non validés ne comptent pas', () => {
    const s1 = session('2026-07-13T10:00:00', '2026-07-13T11:00:00', [
      { exerciseId: 'developpe-couche-barre', sets: [{ reps: '10', weight: '80', validated: false }] },
      { exerciseId: 'squat-barre', sets: [{ reps: '5', weight: '100', validated: true }] },
    ])
    const r = buildCoachSummary([s1], opts)
    const poitrine = r.volumeParGroupe.find((g) => g.groupe === 'Poitrine')
    expect(poitrine).toMatchObject({ sets: 0, volumeKg: 0, seances: 0 })
    expect(r.groupesNegliges).toContain('Poitrine')
  })
})
