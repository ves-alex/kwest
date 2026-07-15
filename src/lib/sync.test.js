import { describe, it, expect, vi, beforeEach } from 'vitest'

// Supabase mocké : on pilote getSession et upsert depuis chaque test.
vi.mock('./supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  },
}))

const SESSION = { user: { id: 'u1' } }

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
})

function mockUpsert({ error = null } = {}) {
  supabase.from.mockReturnValue({ upsert: vi.fn().mockResolvedValue({ error }) })
}

describe('état de synchronisation', () => {
  it('au repos par défaut', () => {
    expect(sync.getSyncState()).toBe('synced')
  })

  it('pushSync programme → pending immédiatement', () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: SESSION } })
    mockUpsert()
    sync.pushSync() // debounce 2 s : le push n'est pas encore parti
    expect(sync.getSyncState()).toBe('pending')
  })

  it('push réussi → synced', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: SESSION } })
    mockUpsert()
    sync.pushSync({ immediate: true })
    await vi.waitFor(() => expect(sync.getSyncState()).toBe('synced'))
  })

  it('push échoué → error (le badge doit apparaître)', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: SESSION } })
    mockUpsert({ error: { message: 'réseau KO' } })
    sync.pushSync({ immediate: true })
    await vi.waitFor(() => expect(sync.getSyncState()).toBe('error'))
  })

  it('exception pendant le push → error', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: SESSION } })
    supabase.from.mockReturnValue({ upsert: vi.fn().mockRejectedValue(new Error('boom')) })
    sync.pushSync({ immediate: true })
    await vi.waitFor(() => expect(sync.getSyncState()).toBe('error'))
  })

  it("sans session : retour au repos, pas de pending fantôme", async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    sync.pushSync({ immediate: true })
    await vi.waitFor(() => expect(sync.getSyncState()).toBe('synced'))
  })

  it('erreur puis push réussi → le badge disparaît', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: SESSION } })
    mockUpsert({ error: { message: 'réseau KO' } })
    sync.pushSync({ immediate: true })
    await vi.waitFor(() => expect(sync.getSyncState()).toBe('error'))

    mockUpsert({ error: null })
    sync.pushSync({ immediate: true })
    await vi.waitFor(() => expect(sync.getSyncState()).toBe('synced'))
  })
})
