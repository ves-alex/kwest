import { describe, it, expect } from 'vitest'
import { COSMETICS, equippedBadgeIds, isCosmeticEquipped } from './cosmetics'

const badges = COSMETICS.filter((c) => c.type === 'badge').map((c) => c.id)
const [b1, b2, b3] = badges

describe('equippedBadgeIds', () => {
  it('champ absent → tous les badges possédés (état historique préservé)', () => {
    const player = { cosmeticsOwned: [b1, b2, b3], cosmeticsEquipped: {} }
    expect(equippedBadgeIds(player)).toEqual([b1, b2, b3])
  })

  it('ancien format mono-badge → ce seul badge', () => {
    const player = { cosmeticsOwned: [b1, b2], cosmeticsEquipped: { badge: b1 } }
    expect(equippedBadgeIds(player)).toEqual([b1])
  })

  it('liste vide → aucun badge (différent d\'un champ absent)', () => {
    const player = { cosmeticsOwned: [b1, b2], cosmeticsEquipped: { badge: [] } }
    expect(equippedBadgeIds(player)).toEqual([])
  })

  it('ignore un badge porté mais plus possédé', () => {
    const player = { cosmeticsOwned: [b1], cosmeticsEquipped: { badge: [b1, b2] } }
    expect(equippedBadgeIds(player)).toEqual([b1])
  })

  it('joueur sans rien → liste vide', () => {
    expect(equippedBadgeIds({ cosmeticsOwned: [], cosmeticsEquipped: {} })).toEqual([])
    expect(equippedBadgeIds(null)).toEqual([])
  })
})

describe('isCosmeticEquipped', () => {
  const badge = COSMETICS.find((c) => c.type === 'badge')
  const aura = COSMETICS.find((c) => c.type === 'aura')

  it('badge : lu dans la liste', () => {
    const player = { cosmeticsOwned: [badge.id], cosmeticsEquipped: { badge: [badge.id] } }
    expect(isCosmeticEquipped(player, badge)).toBe(true)
    expect(isCosmeticEquipped({ ...player, cosmeticsEquipped: { badge: [] } }, badge)).toBe(false)
  })

  it('autre type : lu dans son emplacement unique', () => {
    const player = { cosmeticsOwned: [aura.id], cosmeticsEquipped: { aura: aura.id } }
    expect(isCosmeticEquipped(player, aura)).toBe(true)
    expect(isCosmeticEquipped({ cosmeticsEquipped: {} }, aura)).toBe(false)
  })
})
