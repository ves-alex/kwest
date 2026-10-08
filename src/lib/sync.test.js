import { describe, it, expect, vi, beforeEach } from 'vitest'

// Supabase mocké : routage par table, appels enregistrés pour les assertions.
vi.mock('./supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn(), signOut: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

const USER = 'u1'
const DELETED_KEY = 'kwest:deleted-sessions'
const SESSIONS_KEY = 'kwest:sessions'
const PLAYER_KEY = 'kwest:player'
const ROUTINES_KEY = 'kwest:routines'
const DELETED_ROUTINES_KEY = 'kwest:deleted-routines'
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
  vi.clearAllMocks() // l'historique des appels ne passe pas d'un test à l'autre
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
  routineRows = [],
  routinesError = null,
  deletionRows = [],
  deletionsError = null,
} = {}) {
  const calls = {
    sessionsUpserts: [], sessionsDeletes: [], userUpserts: [], userUpdates: [],
    routinesUpserts: [], routinesDeletes: [], deletionUpserts: [],
  }

  // Table « une ligne par élément » (sessions, routines)
  const rowsTable = ({ rows, upserts, deletes, upsertError = null, deleteError = null, readError = null }) => ({
    select: () => ({ eq: () => Promise.resolve({ data: readError ? null : rows.map((x) => ({ data: x })), error: readError }) }),
    upsert: (r) => { upserts.push(r); return Promise.resolve({ error: upsertError }) },
    delete: () => ({
      eq: () => ({
        eq: (_c, id) => { deletes.push([id]); return Promise.resolve({ error: deleteError }) },
        in: (_c, ids) => { deletes.push(ids); return Promise.resolve({ error: deleteError }) },
      }),
    }),
  })
  const sessionsTable = rowsTable({
    rows: sessionRows, upserts: calls.sessionsUpserts, deletes: calls.sessionsDeletes,
    upsertError: sessionsUpsertError, deleteError: sessionsDeleteError,
  })
  const routinesTable = rowsTable({
    rows: routineRows, upserts: calls.routinesUpserts, deletes: calls.routinesDeletes,
    upsertError: routinesError, deleteError: routinesError, readError: routinesError,
  })
  const deletionsTable = {
    select: () => ({ eq: () => Promise.resolve({ data: deletionsError ? null : deletionRows, error: deletionsError }) }),
    upsert: (r) => { calls.deletionUpserts.push(r); return Promise.resolve({ error: deletionsError }) },
  }
  const userTable = {
    select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: userRow, error: null }) }) }),
    upsert: (row) => { calls.userUpserts.push(row); return Promise.resolve({ error: userUpsertError }) },
    update: (patch) => ({ eq: () => { calls.userUpdates.push(patch); return Promise.resolve({ error: null }) } }),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
  }
  const tables = { sessions: sessionsTable, routines: routinesTable, deletions: deletionsTable, user_data: userTable }
  supabase.from.mockImplementation((t) => tables[t])
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

const R1 = { id: 'r1', name: 'Push', exerciseIds: ['pompes'] }
const R2 = { id: 'r2', name: 'Pull', exerciseIds: ['tractions'] }

describe('routines', () => {
  it('pushRoutines : une ligne par routine dans la table routines', async () => {
    localStorage.setItem(ROUTINES_KEY, JSON.stringify([R1]))
    const calls = mockTables()
    expect(await sync.pushRoutines([R1])).toBe(true)
    expect(calls.routinesUpserts[0]).toMatchObject([{ user_id: USER, id: 'r1', data: R1 }])
    expect(sync.getSyncState()).toBe('synced')
  })

  it('chargement : routines du cloud récupérées, routines locales envoyées', async () => {
    localStorage.setItem(ROUTINES_KEY, JSON.stringify([R1]))
    const calls = mockTables({ userRow: { player: {}, sessions: null }, routineRows: [R2] })

    await sync.loadFromCloud(USER)

    expect(JSON.parse(localStorage.getItem(ROUTINES_KEY)).map((r) => r.id).sort()).toEqual(['r1', 'r2'])
    expect(calls.routinesUpserts.flat().map((r) => r.id)).toEqual(['r1'])
  })

  it('table routines absente (script SQL pas encore passé) : séances fusionnées, routines locales intactes', async () => {
    localStorage.setItem(ROUTINES_KEY, JSON.stringify([R1]))
    mockTables({ userRow: { player: {}, sessions: null }, sessionRows: [A], routinesError: { message: 'relation "routines" does not exist' } })

    expect(await sync.loadFromCloud(USER)).toBe(true)

    expect(JSON.parse(localStorage.getItem(SESSIONS_KEY)).map((s) => s.id)).toEqual(['a'])
    expect(JSON.parse(localStorage.getItem(ROUTINES_KEY))).toEqual([R1])
  })

  it('suppression : tracée puis supprimée du cloud', async () => {
    const calls = mockTables()
    expect(await sync.deleteRoutineCloud('r1')).toBe(true)
    expect(calls.deletionUpserts).toEqual([[{ user_id: USER, kind: 'routine', id: 'r1' }]])
    expect(calls.routinesDeletes).toEqual([['r1']])
    expect(JSON.parse(localStorage.getItem(DELETED_ROUTINES_KEY))).toEqual([])
  })
})

describe('suppressions entre appareils', () => {
  it('une séance supprimée est tracée avant d\'être retirée du cloud', async () => {
    const calls = mockTables()
    await sync.deleteSessionCloud('a')
    expect(calls.deletionUpserts).toEqual([[{ user_id: USER, kind: 'session', id: 'a' }]])
    expect(calls.sessionsDeletes).toEqual([['a']])
  })

  it('supprimée sur un autre appareil : retirée ici, jamais renvoyée au cloud', async () => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([A, B])) // cet appareil a encore « a »
    localStorage.setItem(PENDING_KEY, JSON.stringify({ sessions: ['a'], routines: [], player: false }))
    const calls = mockTables({
      userRow: { player: {}, sessions: null },
      sessionRows: [B],
      deletionRows: [{ kind: 'session', id: 'a' }],
    })

    await sync.loadFromCloud(USER)

    expect(JSON.parse(localStorage.getItem(SESSIONS_KEY)).map((s) => s.id)).toEqual(['b'])
    expect(calls.sessionsUpserts.flat().map((r) => r.id)).not.toContain('a')
    expect(sync.hasPendingSync()).toBe(false)
  })

  it('remise au cloud par une ancienne version de l\'app : re-supprimée', async () => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([]))
    const calls = mockTables({
      userRow: { player: {}, sessions: null },
      sessionRows: [A, B],
      deletionRows: [{ kind: 'session', id: 'a' }],
    })

    await sync.loadFromCloud(USER)

    expect(JSON.parse(localStorage.getItem(SESSIONS_KEY)).map((s) => s.id)).toEqual(['b'])
    expect(calls.sessionsDeletes).toEqual([['a']])
  })

  it('trace illisible (script SQL pas encore passé) : le chargement continue', async () => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([A]))
    mockTables({ userRow: { player: {}, sessions: null }, sessionRows: [A], deletionsError: { message: 'relation "deletions" does not exist' } })
    expect(await sync.loadFromCloud(USER)).toBe(true)
    expect(JSON.parse(localStorage.getItem(SESSIONS_KEY)).map((s) => s.id)).toEqual(['a'])
  })
})

describe('deleteAccount', () => {
  it('supprime le compte côté serveur, ferme la session de ce téléphone, puis vide le stockage', async () => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([A]))
    supabase.rpc.mockResolvedValue({ error: null })
    supabase.auth.signOut.mockResolvedValue({ error: null })

    await sync.deleteAccount()

    expect(supabase.rpc).toHaveBeenCalledWith('delete_my_account')
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(localStorage.length).toBe(0)
  })

  it('échec : rien n\'est effacé, l\'erreur remonte à l\'écran', async () => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([A]))
    supabase.rpc.mockResolvedValue({ error: { message: 'réseau KO' } })

    await expect(sync.deleteAccount()).rejects.toBeTruthy()

    expect(supabase.auth.signOut).not.toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem(SESSIONS_KEY))).toEqual([A])
  })
})
