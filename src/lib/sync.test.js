import { describe, it, expect, vi, beforeEach } from 'vitest'

// Supabase mocké : routage par table, appels enregistrés pour les assertions.
vi.mock('./supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  },
}))

const USER = 'u1'
const DELETED_KEY = 'kwest:deleted-sessions'
const SESSIONS_KEY = 'kwest:sessions'
const PLAYER_KEY = 'kwest:player'

function stubBrowserGlobals() {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  }
  globalThis.window = { dispatchEvent: () => {} }
}

// L'état de sync vit au niveau du module → module frais pour chaque test.
let sync
let supabase

beforeEach(async () => {
  stubBrowserGlobals()
  vi.resetModules()
  sync = await import('./sync')
  ;({ supabase } = await import('./supabase'))
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: USER } } } })
})

function mockTables({
  userRow = null,
  sessionRows = [],
  sessionsUpsertError = null,
  sessionsDeleteError = null,
  userUpsertError = null,
} = {}) {
  const calls = { sessionsUpserts: [], sessionsDeletes: [], userUpserts: [], userUpdates: [] }

  const deleteResult = () => Promise.resolve({ error: sessionsDeleteError })
  const sessionsTable = {
    select: () => ({ eq: () => Promise.resolve({ data: sessionRows.map((s) => ({ data: s })), error: null }) }),
    upsert: (rows) => { calls.sessionsUpserts.push(rows); return Promise.resolve({ error: sessionsUpsertError }) },
    delete: () => ({
      // .eq('user_id', …) est soit chaîné (.eq / .in), soit await-é tel quel (deleteAccount)
      eq: () => ({
        eq: (_c, id) => { calls.sessionsDeletes.push([id]); return deleteResult() },
        in: (_c, ids) => { calls.sessionsDeletes.push(ids); return deleteResult() },
        then: (resolve) => deleteResult().then(resolve),
      }),
    }),
  }
  const userTable = {
    select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: userRow, error: null }) }) }),
    upsert: (row) => { calls.userUpserts.push(row); return Promise.resolve({ error: userUpsertError }) },
    update: (patch) => ({ eq: () => { calls.userUpdates.push(patch); return Promise.resolve({ error: null }) } }),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
  }
  supabase.from.mockImplementation((t) => (t === 'sessions' ? sessionsTable : userTable))
  return calls
}

const A = { id: 'a', startedAt: '2026-07-01T10:00:00', entries: [] }
const B = { id: 'b', startedAt: '2026-07-08T10:00:00', entries: [] }

describe('pushSessions', () => {
  it('upsert une ligne par séance → synced', async () => {
    const calls = mockTables()
    const ok = await sync.pushSessions([A, B])
    expect(ok).toBe(true)
    expect(calls.sessionsUpserts).toHaveLength(1)
    expect(calls.sessionsUpserts[0].map((r) => r.id)).toEqual(['a', 'b'])
    expect(calls.sessionsUpserts[0][0]).toMatchObject({ user_id: USER, id: 'a', data: A })
    expect(sync.getSyncState()).toBe('synced')
  })

  it('échec → error (badge visible)', async () => {
    mockTables({ sessionsUpsertError: { message: 'réseau KO' } })
    const ok = await sync.pushSessions([A])
    expect(ok).toBe(false)
    expect(sync.getSyncState()).toBe('error')
  })

  it('liste vide → rien', async () => {
    const calls = mockTables()
    expect(await sync.pushSessions([])).toBe(true)
    expect(calls.sessionsUpserts).toHaveLength(0)
  })

  it('déconnecté → repos, pas de pending fantôme', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    mockTables()
    expect(await sync.pushSessions([A])).toBe(true)
    expect(sync.getSyncState()).toBe('synced')
  })
})

describe('deleteSessionCloud', () => {
  it('DELETE réussi → tombstone levée, synced', async () => {
    const calls = mockTables()
    expect(await sync.deleteSessionCloud('a')).toBe(true)
    expect(calls.sessionsDeletes).toEqual([['a']])
    expect(JSON.parse(localStorage.getItem(DELETED_KEY))).toEqual([])
    expect(sync.getSyncState()).toBe('synced')
  })

  it('DELETE raté → tombstone conservée pour rejeu, error', async () => {
    mockTables({ sessionsDeleteError: { message: 'offline' } })
    expect(await sync.deleteSessionCloud('a')).toBe(false)
    expect(JSON.parse(localStorage.getItem(DELETED_KEY))).toEqual(['a'])
    expect(sync.getSyncState()).toBe('error')
  })

  it('resyncAll rejoue la tombstone puis repasse synced', async () => {
    mockTables({ sessionsDeleteError: { message: 'offline' } })
    await sync.deleteSessionCloud('a')

    const calls = mockTables() // le réseau revient
    await sync.resyncAll()
    expect(calls.sessionsDeletes).toEqual([['a']]) // flush du tombstone (.in)
    expect(JSON.parse(localStorage.getItem(DELETED_KEY))).toEqual([])
    expect(sync.getSyncState()).toBe('synced')
  })
})

describe('pushPlayer', () => {
  it('immediate : upsert player seul (jamais le blob sessions) → synced', async () => {
    localStorage.setItem(PLAYER_KEY, JSON.stringify({ gender: 'm', totalXp: 12 }))
    const calls = mockTables()
    sync.pushPlayer({ immediate: true })
    await vi.waitFor(() => expect(calls.userUpserts).toHaveLength(1))
    expect(calls.userUpserts[0]).toMatchObject({ id: USER, player: { gender: 'm', totalXp: 12 } })
    expect(calls.userUpserts[0]).not.toHaveProperty('sessions')
    await vi.waitFor(() => expect(sync.getSyncState()).toBe('synced'))
  })

  it('debounce : pending immédiatement, sans appel réseau', () => {
    const calls = mockTables()
    sync.pushPlayer()
    expect(sync.getSyncState()).toBe('pending')
    expect(calls.userUpserts).toHaveLength(0)
  })
})

describe('loadFromCloud', () => {
  it('fusion : cloud prioritaire par id, locales absentes réinjectées et poussées', async () => {
    const cloudA = { ...A, rpe: 3 } // version cloud plus riche
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([A, B])) // B inconnue du cloud
    const calls = mockTables({ userRow: { player: { gender: 'm' }, sessions: null }, sessionRows: [cloudA] })

    expect(await sync.loadFromCloud(USER)).toBe(true)

    const merged = JSON.parse(localStorage.getItem(SESSIONS_KEY))
    expect(merged.find((s) => s.id === 'a').rpe).toBe(3) // cloud a gagné
    expect(merged.map((s) => s.id).sort()).toEqual(['a', 'b'])
    // B réinjectée au cloud
    const pushed = calls.sessionsUpserts.flat()
    expect(pushed.map((r) => r.id)).toEqual(['b'])
  })

  it('tombstone : la séance supprimée hors-ligne ne ressuscite pas', async () => {
    localStorage.setItem(DELETED_KEY, JSON.stringify(['a']))
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([]))
    const calls = mockTables({ userRow: { player: {}, sessions: null }, sessionRows: [A, B] })

    await sync.loadFromCloud(USER)

    const merged = JSON.parse(localStorage.getItem(SESSIONS_KEY))
    expect(merged.map((s) => s.id)).toEqual(['b']) // 'a' écartée
    expect(calls.sessionsDeletes).toEqual([['a']]) // DELETE rejoué
    expect(JSON.parse(localStorage.getItem(DELETED_KEY))).toEqual([])
  })

  it('migre le blob historique vers la table puis le vide', async () => {
    const calls = mockTables({ userRow: { player: { gender: 'f' }, sessions: [A, B] }, sessionRows: [] })

    await sync.loadFromCloud(USER)

    // upsert des lignes migrées
    expect(calls.sessionsUpserts[0].map((r) => r.id)).toEqual(['a', 'b'])
    // blob remis à null
    expect(calls.userUpdates).toEqual([{ sessions: null }])
  })

  it('blob non migrable (erreur) : reste la source, pas de perte', async () => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([]))
    mockTables({
      userRow: { player: {}, sessions: [A] },
      sessionRows: [],
      sessionsUpsertError: { message: 'table manquante' },
    })

    await sync.loadFromCloud(USER)

    const merged = JSON.parse(localStorage.getItem(SESSIONS_KEY))
    expect(merged.map((s) => s.id)).toEqual(['a']) // le blob alimente quand même le local
  })

  it('première connexion : le player local est conservé et poussé', async () => {
    localStorage.setItem(PLAYER_KEY, JSON.stringify({ gender: 'm', cosmeticsOwned: ['skin-m1'] }))
    const calls = mockTables({ userRow: null, sessionRows: [] })

    await sync.loadFromCloud(USER)

    expect(JSON.parse(localStorage.getItem(PLAYER_KEY)).gender).toBe('m')
    await vi.waitFor(() => expect(calls.userUpserts).toHaveLength(1))
    expect(calls.userUpserts[0].player.gender).toBe('m')
  })

  it('player : union des possessions, max des compteurs', async () => {
    localStorage.setItem(PLAYER_KEY, JSON.stringify({ gender: 'm', cosmeticsOwned: ['x'], runesSpent: 100 }))
    mockTables({ userRow: { player: { gender: 'm', cosmeticsOwned: ['y'], runesSpent: 50 }, sessions: null }, sessionRows: [] })

    await sync.loadFromCloud(USER)

    const p = JSON.parse(localStorage.getItem(PLAYER_KEY))
    expect(p.cosmeticsOwned.sort()).toEqual(['x', 'y'])
    expect(p.runesSpent).toBe(100)
  })
})
