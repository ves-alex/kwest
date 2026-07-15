import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  migrateSessionsStrictV1,
  getPersonalRecord,
  getLastPerformance,
  saveSession,
  deleteSession,
  loadSessions,
} from './sessions'
import { SESSIONS_KEY } from './keys'
import { pushSessions, deleteSessionCloud } from '../lib/sync'

// La couche sync (Supabase) n'a rien à faire dans ces tests : on la neutralise.
vi.mock('../lib/sync', () => ({ pushSessions: vi.fn(), deleteSessionCloud: vi.fn() }))

// Stub localStorage minimal pour l'environnement node
function stubLocalStorage() {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  }
}

beforeEach(() => {
  stubLocalStorage()
  vi.clearAllMocks()
})

describe('migrateSessionsStrictV1', () => {
  const finished = () => ({
    id: 's1',
    startedAt: '2026-07-01T10:00:00',
    endedAt: '2026-07-01T11:00:00',
    entries: [
      {
        exerciseId: 'pompes',
        sets: [
          { reps: '10', validated: false }, // pré-strict → doit passer à true
          { reps: '', validated: false },   // set vide → reste false
          { reps: '8', validated: true },   // déjà validé → intact
        ],
      },
    ],
  })

  it('remonte à true les sets remplis des séances terminées, et pousse les séances touchées', () => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([finished()]))
    migrateSessionsStrictV1()
    const [s] = JSON.parse(localStorage.getItem(SESSIONS_KEY))
    expect(s.entries[0].sets.map((x) => x.validated)).toEqual([true, false, true])
    expect(pushSessions).toHaveBeenCalledTimes(1)
    expect(pushSessions.mock.calls[0][0].map((x) => x.id)).toEqual(['s1'])
  })

  it('ne touche pas aux séances non clôturées', () => {
    const active = { ...finished(), id: 's2', endedAt: null }
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([active]))
    migrateSessionsStrictV1()
    const [s] = JSON.parse(localStorage.getItem(SESSIONS_KEY))
    expect(s.entries[0].sets[0].validated).toBe(false)
    expect(pushSessions).not.toHaveBeenCalled()
  })

  it('idempotente : une deuxième passe ne change rien', () => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([finished()]))
    migrateSessionsStrictV1()
    const after1 = localStorage.getItem(SESSIONS_KEY)
    vi.clearAllMocks()
    migrateSessionsStrictV1()
    expect(localStorage.getItem(SESSIONS_KEY)).toBe(after1)
    expect(pushSessions).not.toHaveBeenCalled()
  })
})

describe('saveSession / deleteSession — pushes unitaires', () => {
  const s1 = { id: 's1', startedAt: '2026-07-01T10:00:00', endedAt: '2026-07-01T11:00:00', entries: [] }

  it('saveSession écrit localement et pousse SA ligne', () => {
    expect(saveSession(s1)).toBe(true)
    expect(loadSessions().map((s) => s.id)).toEqual(['s1'])
    expect(pushSessions).toHaveBeenCalledWith([s1])
  })

  it('deleteSession retire localement et demande le DELETE cloud', () => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([s1]))
    expect(deleteSession('s1')).toBe(true)
    expect(loadSessions()).toEqual([])
    expect(deleteSessionCloud).toHaveBeenCalledWith('s1')
  })
})

describe('getPersonalRecord', () => {
  const sessions = [
    {
      id: 'a', startedAt: '2026-07-01T10:00:00',
      entries: [{ exerciseId: 'developpe-couche-barre', sets: [{ reps: '10', weight: '80' }] }],
    },
    {
      id: 'b', startedAt: '2026-07-08T10:00:00',
      entries: [{ exerciseId: 'developpe-couche-barre', sets: [{ reps: '6', weight: '90' }, { reps: '8', weight: '90' }] }],
    },
  ]

  it('charge : poids max, départage aux reps', () => {
    expect(getPersonalRecord('developpe-couche-barre', sessions)).toEqual({ weight: 90, reps: 8 })
  })

  it('reps/temps : valeur principale max', () => {
    const bw = [
      { id: 'a', startedAt: '2026-07-01T10:00:00', entries: [{ exerciseId: 'pompes', sets: [{ reps: '15', weight: '' }, { reps: '22', weight: '' }] }] },
    ]
    expect(getPersonalRecord('pompes', bw)).toEqual({ weight: 0, reps: 22 })
  })

  it('aucun historique → null', () => {
    expect(getPersonalRecord('squat-barre', sessions)).toBeNull()
  })
})

describe('getLastPerformance', () => {
  it('retourne le dernier set de la séance la plus récente', () => {
    const sessions = [
      { id: 'vieille', startedAt: '2026-07-01T10:00:00', entries: [{ exerciseId: 'pompes', sets: [{ reps: '10', weight: '' }] }] },
      { id: 'recente', startedAt: '2026-07-10T10:00:00', entries: [{ exerciseId: 'pompes', sets: [{ reps: '12', weight: '' }, { reps: '9', weight: '' }] }] },
    ]
    expect(getLastPerformance('pompes', sessions)).toEqual({ reps: '9', weight: '' })
  })

  it('exercice jamais pratiqué → null', () => {
    expect(getLastPerformance('inconnu', [])).toBeNull()
  })
})
