import { describe, it, expect, beforeEach } from 'vitest'
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js'
import { canStayOffline, hasLocalProfile } from './startup'
import { PLAYER_KEY } from '../storage/keys'

function stubLocalStorage() {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  }
}

describe('hasLocalProfile', () => {
  beforeEach(stubLocalStorage)

  it('vrai seulement si le profil local a passé l\'onboarding', () => {
    expect(hasLocalProfile()).toBe(false)
    localStorage.setItem(PLAYER_KEY, JSON.stringify({ gender: null }))
    expect(hasLocalProfile()).toBe(false)
    localStorage.setItem(PLAYER_KEY, JSON.stringify({ gender: 'F' }))
    expect(hasLocalProfile()).toBe(true)
  })

  it('profil illisible → faux, sans planter', () => {
    localStorage.setItem(PLAYER_KEY, '{oups')
    expect(hasLocalProfile()).toBe(false)
  })
})

describe('canStayOffline', () => {
  // Erreur rendue par getSession() quand le jeton a expiré et que le
  // renouvellement échoue faute de réseau
  const offline = new AuthRetryableFetchError('Failed to fetch', 0)

  it('hors ligne avec un profil local : on garde l\'app', () => {
    expect(canStayOffline(offline, true)).toBe(true)
  })

  it('hors ligne sans profil local (première connexion) : écran de connexion', () => {
    expect(canStayOffline(offline, false)).toBe(false)
  })

  it('session refusée par le serveur (jeton révoqué) : écran de connexion', () => {
    const revoked = new AuthApiError('Invalid Refresh Token: Refresh Token Not Found', 400, 'refresh_token_not_found')
    expect(canStayOffline(revoked, true)).toBe(false)
  })

  it('aucune session enregistrée (pas d\'erreur) : écran de connexion', () => {
    expect(canStayOffline(null, true)).toBe(false)
  })
})
