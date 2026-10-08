import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveRoutine, deleteRoutine, duplicateRoutine, loadRoutines } from './routines'
import { pushRoutines, deleteRoutineCloud } from '../lib/sync'

// La couche sync (Supabase) n'a rien à faire dans ces tests : on la neutralise.
vi.mock('../lib/sync', () => ({ pushRoutines: vi.fn(), deleteRoutineCloud: vi.fn() }))

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

const R = { id: 'r1', name: 'Push', exerciseIds: ['pompes'] }

describe('routines — sauvegardées en local puis envoyées au cloud', () => {
  it('saveRoutine écrit localement et pousse SA ligne', () => {
    expect(saveRoutine(R)).toBe(true)
    expect(loadRoutines()).toEqual([R])
    expect(pushRoutines).toHaveBeenCalledWith([R])
  })

  it('renommer pousse la nouvelle version', () => {
    saveRoutine(R)
    saveRoutine({ ...R, name: 'Push lourd' })
    expect(pushRoutines).toHaveBeenLastCalledWith([{ ...R, name: 'Push lourd' }])
  })

  it('deleteRoutine retire localement et supprime au cloud', () => {
    saveRoutine(R)
    expect(deleteRoutine('r1')).toBe(true)
    expect(loadRoutines()).toEqual([])
    expect(deleteRoutineCloud).toHaveBeenCalledWith('r1')
  })

  it('duplicateRoutine pousse la copie', () => {
    saveRoutine(R)
    const copy = duplicateRoutine('r1')
    expect(copy.id).not.toBe('r1')
    expect(pushRoutines).toHaveBeenLastCalledWith([copy])
  })
})
