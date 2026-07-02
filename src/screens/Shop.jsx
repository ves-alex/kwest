import { useState } from 'react'
import { Check } from 'lucide-react'
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
import { RARITY_STYLES } from '../theme/rarity'
import ItemPreview from './shop/ItemPreview'
import ShopItemSheet from './shop/ShopItemSheet'

const SECTIONS = [
  { type: 'skin', label: 'Apparences' },
  { type: 'badge', label: 'Badges' },
  { type: 'fond-avatar', label: "Fonds d'avatar" },
  { type: 'aura', label: 'Auras' },
  { type: 'titre', label: 'Titres' },
  { type: 'fond', label: 'Fonds de page' },
]

export default function Shop() {
  const [player, setPlayer] = useState(loadPlayer)
  const [pendingBuy, setPendingBuy] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
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

      <div className="mt-10 space-y-8">
        {SECTIONS.map(({ type, label }) => {
          const items = COSMETICS.filter((c) => c.type === type)
          if (items.length === 0) return null
          return (
            <section key={type}>
              <p className="px-0 text-[9px] uppercase tracking-[0.35em] text-ash/60">{label}</p>
              <div className="-mx-6 mt-3 flex gap-3 overflow-x-auto px-6 pb-2">
                {items.map((c) => {
                  const style = RARITY_STYLES[c.rarity]
                  const rarity = RARITIES[c.rarity]
                  const isOwned = player.cosmeticsOwned.includes(c.id)
                  const isEquipped = player.cosmeticsEquipped?.[c.type] === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedItem(c)}
                      className={`relative w-[136px] shrink-0 overflow-hidden rounded-2xl border-2 bg-forge text-left transition-all active:scale-95 ${
                        isEquipped ? 'border-glow' : style.border
                      } ${!isOwned ? style.glow : ''}`}
                    >
                      {/* Bandeau rareté */}
                      <div
                        className={`flex items-center justify-center gap-1.5 border-b py-1.5 ${style.headerBg} ${style.headerBorder}`}
                      >
                        <span className={`text-[10px] leading-none ${style.text}`}>
                          {style.symbol}
                        </span>
                        <span
                          className={`text-[8px] font-medium uppercase tracking-[0.3em] ${style.text}`}
                        >
                          {rarity.label}
                        </span>
                      </div>

                      {/* Preview */}
                      <div className="flex min-h-[96px] flex-col items-center justify-center px-3 pt-3 pb-2">
                        <ItemPreview c={c} player={player} size="sm" />
                      </div>

                      {/* Nom + prix / état */}
                      <div className="border-t border-forge-light/40 px-3 py-2">
                        <p className="line-clamp-2 min-h-[26px] text-[11px] font-medium leading-tight text-cream">
                          {c.name}
                        </p>
                        <div className="mt-1.5">
                          {isEquipped ? (
                            <span className="flex items-center gap-1 text-glow">
                              <Check size={10} strokeWidth={2.5} />
                              <span className="text-[9px] font-medium uppercase tracking-[0.15em]">
                                Équipé
                              </span>
                            </span>
                          ) : isOwned ? (
                            <span className="text-[9px] uppercase tracking-[0.15em] text-ash/60">
                              Possédé
                            </span>
                          ) : (
                            <span className="font-mono text-[11px] font-medium text-ember">
                              {RUNE_SYMBOL} {c.price}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
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
