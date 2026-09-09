import { pushPlayer } from '../lib/sync'
import { PLAYER_KEY, SESSIONS_KEY } from './keys'
import { evaluateBadges } from '../domain/badges'
import { recomputeTotalsFromSessions } from '../domain/economy'
import { equippedBadgeIds } from '../domain/cosmetics'

const DEFAULT_PLAYER = {
  gender: null,
  totalRunes: 0,
  runesSpent: 0,
  totalXp: 0,
  weeklyGoal: 3,
  cosmeticsOwned: [],
  cosmeticsEquipped: {},
  badgesUnlocked: [],
  prestigeStars: 0,
}

export function setWeeklyGoal(n) {
  const p = loadPlayer()
  p.weeklyGoal = Math.max(1, Math.min(7, Math.floor(n)))
  savePlayer(p)
  return p
}

export function setGender(g) {
  const p = loadPlayer()
  p.gender = g
  savePlayer(p)
  return p
}

export function loadPlayer() {
  try {
    const raw = localStorage.getItem(PLAYER_KEY)
    const player = raw
      ? { ...DEFAULT_PLAYER, ...JSON.parse(raw) }
      : { ...DEFAULT_PLAYER }

    // Les badges se portent à plusieurs : `cosmeticsEquipped.badge` est une liste.
    // Normalisée ici (en mémoire) pour que le reste du code n'ait qu'un format à
    // gérer ; elle sera écrite au prochain savePlayer. Cas hérités traités par
    // `equippedBadgeIds` — dont l'absence de champ, qui vaut « tous les possédés ».
    player.cosmeticsEquipped = {
      ...player.cosmeticsEquipped,
      badge: equippedBadgeIds(player),
    }

    // Anti-triche faible : les totaux doivent coller à la somme des sessions.
    // Si édition manuelle de localStorage → on réaligne sur la vérité sessions.
    const sessionsRaw = localStorage.getItem(SESSIONS_KEY)
    const sessions = sessionsRaw ? JSON.parse(sessionsRaw) : []
    const { runes: expectedRunes, xp: expectedXp } = recomputeTotalsFromSessions(sessions)
    if (player.totalRunes !== expectedRunes || player.totalXp !== expectedXp) {
      player.totalRunes = expectedRunes
      player.totalXp = expectedXp
      localStorage.setItem(PLAYER_KEY, JSON.stringify(player))
      pushPlayer() // push la correction au cloud
    }
    return player
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

export function savePlayer(player, { evalBadges = true } = {}) {
  try {
    // Auto-évaluation des badges qui ne dépendent pas d'une nouvelle séance
    // (achat de cosmétique, seuil de runes cumulées, etc.)
    let toWrite = player
    if (evalBadges) {
      const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]')
      const unlocked = evaluateBadges(player, sessions)
      const current = new Set(player.badgesUnlocked ?? [])
      const merged = Array.from(new Set([...current, ...unlocked]))
      if (merged.length !== current.size) {
        toWrite = { ...player, badgesUnlocked: merged }
      }
    }
    localStorage.setItem(PLAYER_KEY, JSON.stringify(toWrite))
    emitPlayerChange()
    pushPlayer()
    return true
  } catch (err) {
    console.error('[kwest] savePlayer failed', err)
    return false
  }
}

export function getBalance(player) {
  return player.totalRunes - player.runesSpent
}

// --- Cosmétiques ---

export function buyCosmetic(id, price, type) {
  const p = loadPlayer()
  if (getBalance(p) < price) return null
  if (p.cosmeticsOwned.includes(id)) return null
  p.runesSpent += price
  p.cosmeticsOwned = [...p.cosmeticsOwned, id]
  // Équipe automatiquement. Un badge s'ajoute aux autres ; tout autre type
  // remplace celui qu'il portait.
  p.cosmeticsEquipped =
    type === 'badge'
      ? { ...p.cosmeticsEquipped, badge: [...new Set([...(p.cosmeticsEquipped.badge ?? []), id])] }
      : { ...p.cosmeticsEquipped, [type]: id }
  savePlayer(p)
  return p
}

// Prestige : sacrifie `cost` runes contre une Étoile de forge permanente.
// Répétable à l'infini — c'est le débouché des runes excédentaires post-boutique.
export function forgePrestigeStar(cost) {
  const p = loadPlayer()
  if (getBalance(p) < cost) return null
  p.runesSpent += cost
  p.prestigeStars = (p.prestigeStars ?? 0) + 1
  savePlayer(p)
  return p
}

// Bascule un badge : porté → retiré, retiré → porté. Les badges cumulent,
// donc pas de remplacement comme pour les autres types.
export function toggleBadge(id) {
  const p = loadPlayer()
  if (!p.cosmeticsOwned.includes(id)) return null
  const current = p.cosmeticsEquipped.badge ?? []
  const next = current.includes(id)
    ? current.filter((x) => x !== id)
    : [...current, id]
  p.cosmeticsEquipped = { ...p.cosmeticsEquipped, badge: next }
  savePlayer(p)
  return p
}

// Remplace la liste des badges portés (une liste vide = aucun badge, ce qui
// est différent d'un champ absent : celui-là veut dire « tous les possédés »).
export function setEquippedBadges(ids) {
  const p = loadPlayer()
  p.cosmeticsEquipped = {
    ...p.cosmeticsEquipped,
    badge: ids.filter((id) => p.cosmeticsOwned.includes(id)),
  }
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
