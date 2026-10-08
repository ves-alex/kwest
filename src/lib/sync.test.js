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
const PENDING_KEY = 'kwest:pending'
const OWNER_KEY = 'kwest:owner'

function stubBrowserGlobals() {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: (i) => [...store.keys()][i] ?? null,
    get length() { return store.size },
  }
  globalThis.window = { dispatchEvent: () => {}, addEventListener: () => {} }
  globalThis.document = { addEventListener: () => {}, visibilityState: 'visible' }
}

// Relance de l'app : module (état mémoire) neuf, stockage local conservé
async function relaunch() {
  vi.resetModules()
  sync = await import('./sync')
  ;({ supabase } = await import('./supabase'))
  supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: USER } } } })
  sync.initSyncRetry()
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

  it('session illisible (jeton expiré hors ligne) → la séance reste en attente, badge visible', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    const calls = mockTables()
    expect(await sync.pushSessions([A])).toBe(false)
    expect(calls.sessionsUpserts).toHaveLength(0)
    expect(sync.hasPendingSync()).toBe(true)
    expect(sync.getSyncState()).toBe('error')
  })

  it('un succès ne masque plus l\'échec d\'un autre envoi', async () => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([A]))
    mockTables({ sessionsUpsertError: { message: 'réseau KO' } })
    await sync.pushSessions([A])
    sync.pushPlayer({ immediate: true }) // le profil, lui, passe
    await vi.waitFor(() => expect(sync.getSyncState()).not.toBe('pending'))
    expect(sync.getSyncState()).toBe('error')
  })

  it('la file survit à l\'app tuée : relancée, elle signale l\'attente et la renvoie', async () => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([A]))
    mockTables({ sessionsUpsertError: { message: 'réseau KO' } })
    await sync.pushSessions([A])

    await relaunch()
    expect(sync.getSyncState()).toBe('error')
    const calls = mockTables() // le réseau revient
    await sync.resyncAll()
    expect(calls.sessionsUpserts.flat().map((r) => r.id)).toEqual(['a'])
    expect(sync.getSyncState()).toBe('synced')
  })

  it('séance modifiée pendant l\'envoi : reste en attente pour sa nouvelle version', async () => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([A]))
    mockTables()
    const pushing = sync.pushSessions([A])
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([{ ...A, rpe: 4 }])) // RPE saisi entre-temps
    await pushing
    expect(sync.hasPendingSync()).toBe(true)
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

  it('session illisible (jeton expiré hors ligne) → tombstone conservée, rejouée ensuite', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    const offline = mockTables()
    await sync.deleteSessionCloud('a')
    expect(offline.sessionsDeletes).toEqual([])
    expect(JSON.parse(localStorage.getItem(DELETED_KEY))).toEqual(['a'])

    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: USER } } } })
    const calls = mockTables() // le jeton est renouvelé au retour du réseau
    await sync.resyncAll()
    expect(calls.sessionsDeletes).toEqual([['a']])
    expect(JSON.parse(localStorage.getItem(DELETED_KEY))).toEqual([])
  })

  it('resyncAll ne renvoie que ce qui attend, pas tout l\'historique', async () => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([A, B]))
    localStorage.setItem(PENDING_KEY, JSON.stringify({ sessions: ['b'], player: false }))
    const calls = mockTables()
    await sync.resyncAll()
    expect(calls.sessionsUpserts.flat().map((r) => r.id)).toEqual(['b'])
    expect(calls.userUpserts).toHaveLength(0)
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

  it('séance modifiée hors ligne (pas encore confirmée) : sa version locale gagne et repart', async () => {
    const local = { ...A, rpe: 4 } // RPE saisi sans réseau
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([local]))
    localStorage.setItem(PENDING_KEY, JSON.stringify({ sessions: ['a'], player: false }))
    const calls = mockTables({ userRow: { player: { gender: 'm' }, sessions: null }, sessionRows: [A] })

    await sync.loadFromCloud(USER)

    expect(JSON.parse(localStorage.getItem(SESSIONS_KEY)).find((s) => s.id === 'a').rpe).toBe(4)
    expect(calls.sessionsUpserts.flat().map((r) => r.data.rpe)).toEqual([4])
    expect(sync.hasPendingSync()).toBe(false)
  })

  it('profil modifié hors ligne (pas encore confirmé) : ses réglages l\'emportent', async () => {
    localStorage.setItem(PLAYER_KEY, JSON.stringify({ gender: 'm', weeklyGoal: 5, cosmeticsOwned: ['x'] }))
    localStorage.setItem(PENDING_KEY, JSON.stringify({ sessions: [], player: true }))
    const calls = mockTables({ userRow: { player: { gender: 'm', weeklyGoal: 3, cosmeticsOwned: ['y'] }, sessions: null }, sessionRows: [] })

    await sync.loadFromCloud(USER)

    const p = JSON.parse(localStorage.getItem(PLAYER_KEY))
    expect(p.weeklyGoal).toBe(5)
    expect(p.cosmeticsOwned.sort()).toEqual(['x', 'y'])
    await vi.waitFor(() => expect(calls.userUpserts).toHaveLength(1))
    expect(calls.userUpserts[0].player.weeklyGoal).toBe(5)
  })

  it('données locales d\'un autre compte : effacées, jamais versées dans ce compte', async () => {
    localStorage.setItem(OWNER_KEY, 'u-precedent')
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([A]))
    localStorage.setItem(PLAYER_KEY, JSON.stringify({ gender: 'f', cosmeticsOwned: ['z'] }))
    localStorage.setItem('sb-127-auth-token', 'session-du-nouveau-compte')
    const calls = mockTables({ userRow: null, sessionRows: [] })

    await sync.loadFromCloud(USER)

    expect(calls.sessionsUpserts).toHaveLength(0)
    expect(calls.userUpserts).toHaveLength(0)
    expect(JSON.parse(localStorage.getItem(SESSIONS_KEY))).toEqual([])
    expect(localStorage.getItem(PLAYER_KEY)).toBeNull()
    expect(localStorage.getItem(OWNER_KEY)).toBe(USER)
    expect(localStorage.getItem('sb-127-auth-token')).toBe('session-du-nouveau-compte')
  })

  it('même compte : les données locales sont gardées', async () => {
    localStorage.setItem(OWNER_KEY, USER)
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([A]))
    mockTables({ userRow: null, sessionRows: [] })
    await sync.loadFromCloud(USER)
    expect(JSON.parse(localStorage.getItem(SESSIONS_KEY)).map((s) => s.id)).toEqual(['a'])
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
