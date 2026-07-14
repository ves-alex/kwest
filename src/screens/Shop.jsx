import { useState } from 'react'
import ConfirmModal from '../components/ui/ConfirmModal'
import { COSMETICS, RARITIES } from '../domain/cosmetics'
import {
  loadPlayer,
  getBalance,
  buyCosmetic,
  equipCosmetic,
  unequipCosmetic,
} from '../storage/player'
import { RUNE_SYMBOL } from '../domain/economy'
import ShopCard from './shop/ShopCard'
import ShopItemSheet from './shop/ShopItemSheet'
import PrestigeForge from './shop/PrestigeForge'

const SECTIONS = [
  { type: 'skin', label: 'Apparences' },
  { type: 'badge', label: 'Badges' },
  { type: 'fond-avatar', label: "Fonds d'avatar" },
  { type: 'aura', label: 'Auras' },
  { type: 'titre', label: 'Titres' },
  { type: 'fond', label: 'Fonds de page' },
]

// Classement par rareté (ordre de progression) puis prix. Dans ces données la
// rareté et le prix vont de pair, donc un seul ordre suffit.
function sortItems(items) {
  return [...items].sort(
    (a, b) => RARITIES[a.rarity].order - RARITIES[b.rarity].order || a.price - b.price,
  )
}

function Row({ children }) {
  return <div className="-mx-6 mt-3 flex gap-3 overflow-x-auto px-6 pb-2">{children}</div>
}

function SubLabel({ children }) {
  return (
    <p className="mt-4 text-[8px] uppercase tracking-[0.35em] text-ash/50">{children}</p>
  )
}

export default function Shop() {
  const [player, setPlayer] = useState(loadPlayer)
  const [pendingBuy, setPendingBuy] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [affordableOnly, setAffordableOnly] = useState(false)
  const balance = getBalance(player)

  const confirmBuy = () => {
    if (!pendingBuy) return
    const next = buyCosmetic(pendingBuy.id, pendingBuy.price, pendingBuy.type)
    setPlayer(next ?? loadPlayer())
    setPendingBuy(null)
  }

  const handleEquip = (c) => {
    setPlayer(equipCosmetic(c.type, c.id))
    setSelectedItem(null)
  }

  const handleUnequip = (type) => {
    setPlayer(unequipCosmetic(type))
    setSelectedItem(null)
  }

  const handleBuyRequest = (c) => {
    setSelectedItem(null)
    setPendingBuy(c)
  }

  const pill = (active) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] transition-colors ${
      active
        ? 'border-ember bg-ember/20 text-cream'
        : 'border-forge-light bg-transparent text-ash hover:border-ember hover:text-cream'
    }`

  return (
    <div className="px-6 py-10">
      <header className="mx-auto max-w-md text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-ash">dépense tes runes</p>
        <h1 className="mt-3 font-display text-4xl uppercase tracking-[0.15em] text-cream sm:text-5xl sm:tracking-[0.2em]">
          Atelier
        </h1>
        <p className="mt-4 font-display text-2xl tracking-wider text-ember">
          {RUNE_SYMBOL} {balance}
        </p>
      </header>

      {/* Filtre budget (s'applique à « À forger ») */}
      <div className="mx-auto mt-6 flex max-w-md items-center justify-center">
        <button
          type="button"
          onClick={() => setAffordableOnly((v) => !v)}
          className={pill(affordableOnly)}
          aria-pressed={affordableOnly}
        >
          {RUNE_SYMBOL} Dans mon budget
        </button>
      </div>

      <div className="mt-8 space-y-8">
        {SECTIONS.map(({ type, label }) => {
          const items = COSMETICS.filter((c) => c.type === type)
          if (items.length === 0) return null

          const owned = sortItems(
            items.filter((c) => player.cosmeticsOwned.includes(c.id)),
          )
          let toForge = items.filter((c) => !player.cosmeticsOwned.includes(c.id))
          if (affordableOnly) toForge = toForge.filter((c) => c.price <= balance)
          toForge = sortItems(toForge)

          if (owned.length === 0 && toForge.length === 0) return null
          const showSubLabels = owned.length > 0 && toForge.length > 0

          return (
            <section key={type}>
              <p className="text-[9px] uppercase tracking-[0.35em] text-ash/60">{label}</p>

              {toForge.length > 0 && (
                <>
                  {showSubLabels && <SubLabel>À forger</SubLabel>}
                  <Row>
                    {toForge.map((c) => (
                      <ShopCard key={c.id} c={c} player={player} onSelect={setSelectedItem} />
                    ))}
                  </Row>
                </>
              )}

              {owned.length > 0 && (
                <>
                  {showSubLabels && <SubLabel>Ta collection</SubLabel>}
                  <Row>
                    {owned.map((c) => (
                      <ShopCard key={c.id} c={c} player={player} onSelect={setSelectedItem} />
                    ))}
                  </Row>
                </>
              )}
            </section>
          )
        })}

        <PrestigeForge player={player} balance={balance} onForged={setPlayer} />
      </div>

      <ShopItemSheet
        item={selectedItem}
        player={player}
        balance={balance}
        onClose={() => setSelectedItem(null)}
        onBuyRequest={handleBuyRequest}
        onEquip={handleEquip}
        onUnequip={handleUnequip}
      />

      <ConfirmModal
        isOpen={!!pendingBuy}
        title={`Acquérir « ${pendingBuy?.name} » ?`}
        message={`${pendingBuy?.price} ${RUNE_SYMBOL} seront dépensées de ton solde.`}
        confirmLabel={`Acquérir · ${pendingBuy?.price} ${RUNE_SYMBOL}`}
        cancelLabel="Annuler"
        onConfirm={confirmBuy}
        onCancel={() => setPendingBuy(null)}
      />
    </div>
  )
}
