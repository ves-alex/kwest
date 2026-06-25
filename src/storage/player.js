const PLAYER_KEY = 'kwest:player'

const DEFAULT_PLAYER = {
  gender: null,
  totalRunes: 0,
  runesSpent: 0,
  totalXp: 0,
  cosmeticsOwned: [],
  cosmeticsEquipped: {},
  badgesUnlocked: [],
}

export function loadPlayer() {
  try {
    const raw = localStorage.getItem(PLAYER_KEY)
    return raw
      ? { ...DEFAULT_PLAYER, ...JSON.parse(raw) }
      : { ...DEFAULT_PLAYER }
  } catch (err) {
    console.error('[kwest] loadPlayer failed', err)
    return { ...DEFAULT_PLAYER }
  }
}

// Notifie les composants abonnés (Layout, etc.) d'un changement du PlayerState.
// Évite d'avoir à passer un Context global pour un seul cas d'usage.
function emitPlayerChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('kwest:player-change'))
  }
}

export function savePlayer(player) {
  try {
    localStorage.setItem(PLAYER_KEY, JSON.stringify(player))
    emitPlayerChange()
    return true
  } catch (err) {
    console.error('[kwest] savePlayer failed', err)
    return false
  }
}

export function addRunes(amount) {
  const p = loadPlayer()
  p.totalRunes += amount
  savePlayer(p)
  return p
}

export function addXp(amount) {
  const p = loadPlayer()
  p.totalXp += amount
  savePlayer(p)
  return p
}

export function spendRunes(amount) {
  const p = loadPlayer()
  if (getBalance(p) < amount) return null
  p.runesSpent += amount
  savePlayer(p)
  return p
}

export function getBalance(player) {
  return player.totalRunes - player.runesSpent
}

export function resetPlayer() {
  try {
    localStorage.removeItem(PLAYER_KEY)
    emitPlayerChange()
    return true
  } catch (err) {
    console.error('[kwest] resetPlayer failed', err)
    return false
  }
}

// --- Cosmétiques ---

export function buyCosmetic(id, price, type) {
  const p = loadPlayer()
  if (getBalance(p) < price) return null
  if (p.cosmeticsOwned.includes(id)) return null
  p.runesSpent += price
  p.cosmeticsOwned = [...p.cosmeticsOwned, id]
  // Équipe automatiquement (remplace l'ancien du même type s'il existe)
  p.cosmeticsEquipped = { ...p.cosmeticsEquipped, [type]: id }
  savePlayer(p)
  return p
}

export function equipCosmetic(type, id) {
  const p = loadPlayer()
  if (!p.cosmeticsOwned.includes(id)) return null
  p.cosmeticsEquipped = { ...p.cosmeticsEquipped, [type]: id }
  savePlayer(p)
  return p
}

export function unequipCosmetic(type) {
  const p = loadPlayer()
  const next = { ...p.cosmeticsEquipped }
  delete next[type]
  p.cosmeticsEquipped = next
  savePlayer(p)
  return p
}

// Appelé une seule fois à l'onboarding — définit le genre et offre la skin de départ
export function initPlayerGender(gender, skinId) {
  const p = loadPlayer()
  p.gender = gender
  if (!p.cosmeticsOwned.includes(skinId)) {
    p.cosmeticsOwned = [...p.cosmeticsOwned, skinId]
  }
  p.cosmeticsEquipped = { ...p.cosmeticsEquipped, skin: skinId }
  savePlayer(p)
  return p
}
