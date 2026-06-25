import { useState } from 'react'
import { Check, ShoppingBag } from 'lucide-react'
import ConfirmModal from '../components/ui/ConfirmModal'
import { COSMETICS, RARITIES, COSMETIC_TYPES } from '../domain/cosmetics'
import {
  loadPlayer,
  getBalance,
  buyCosmetic,
  equipCosmetic,
  unequipCosmetic,
} from '../storage/player'
import { RUNE_SYMBOL } from '../domain/economy'

const RARITY_STYLES = {
  brut: {
    border: 'border-forge-light',
    glow: '',
    stripe: 'bg-ash/30',
    badge: 'bg-ash/15 text-ash',
  },
  forge: {
    border: 'border-ember/60',
    glow: 'shadow-[0_0_24px_-10px_rgba(124,45,18,0.9)]',
    stripe: 'bg-ember',
    badge: 'bg-ember/20 text-ember',
  },
  eveille: {
    border: 'border-glow/70',
    glow: 'shadow-[0_0_32px_-8px_rgba(146,64,14,0.8)]',
    stripe: 'bg-gradient-to-b from-glow to-ember',
    badge: 'bg-glow/20 text-glow',
  },
  ascendant: {
    border: 'border-cream/50',
    glow: 'shadow-[0_0_40px_-6px_rgba(245,240,232,0.3)]',
    stripe: 'bg-gradient-to-b from-cream via-glow to-ember',
    badge: 'bg-cream/15 text-cream',
  },
}

export default function Shop() {
  const [player, setPlayer] = useState(loadPlayer)
  const [pendingBuy, setPendingBuy] = useState(null)
  const balance = getBalance(player)

  const handleBuy = (c) => {
    setPendingBuy(c)
  }

  const confirmBuy = () => {
    if (!pendingBuy) return
    const next = buyCosmetic(pendingBuy.id, pendingBuy.price, pendingBuy.type)
    if (next) setPlayer(next)
    setPendingBuy(null)
  }

  const handleEquip = (c) => {
    setPlayer(equipCosmetic(c.type, c.id))
  }

  const handleUnequip = (type) => {
    setPlayer(unequipCosmetic(type))
  }

  return (
    <div className="px-6 py-10">
      <header className="mx-auto max-w-md text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-ash">
          dépense tes runes
        </p>
        <h1 className="mt-3 font-display text-4xl uppercase tracking-[0.15em] text-cream sm:text-5xl sm:tracking-[0.2em]">
          Atelier
        </h1>
        <p className="mt-4 font-display text-2xl tracking-wider text-ember">
          {RUNE_SYMBOL} {balance}
        </p>
      </header>

      <section className="mx-auto mt-10 max-w-md space-y-4">
        {COSMETICS.map((c) => {
          const rarity = RARITIES[c.rarity]
          const style = RARITY_STYLES[c.rarity]
          const isOwned = player.cosmeticsOwned.includes(c.id)
          const isEquipped = player.cosmeticsEquipped?.[c.type] === c.id
          const canAfford = balance >= c.price
          return (
            <article
              key={c.id}
              className={`relative overflow-hidden rounded-2xl border bg-forge p-4 pl-5 ${
                isOwned ? 'border-glow' : style.border
              } ${!isOwned ? style.glow : ''}`}
            >
              <div
                className={`absolute left-0 top-0 h-full w-1 ${style.stripe}`}
                aria-hidden
              />

              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-cream">{c.name}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.25em] ${style.badge}`}
                    >
                      {rarity.label}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-ash">
                      {COSMETIC_TYPES[c.type]}
                    </span>
                  </div>
                </div>
                <p className="shrink-0 font-mono text-sm text-ember">
                  {RUNE_SYMBOL} {c.price}
                </p>
              </header>

              <p className="mt-3 text-xs leading-relaxed text-ash">
                {c.description}
              </p>

              {/* CTA */}
              <div className="mt-4">
                {!isOwned && canAfford && (
                  <button
                    type="button"
                    onClick={() => handleBuy(c)}
                    className="inline-flex items-center gap-2 rounded-md border border-ember bg-forge px-4 py-2 text-xs uppercase tracking-[0.25em] text-cream transition-colors hover:bg-ember/20"
                  >
                    <ShoppingBag size={12} className="text-ember" />
                    Acquérir
                  </button>
                )}
                {!isOwned && !canAfford && (
                  <p className="text-[10px] uppercase tracking-[0.3em] text-ash/60">
                    pas assez de runes
                  </p>
                )}
                {isOwned && isEquipped && (
                  <button
                    type="button"
                    onClick={() => handleUnequip(c.type)}
                    className="inline-flex items-center gap-2 rounded-md border border-glow bg-forge px-4 py-2 text-xs uppercase tracking-[0.25em] text-glow transition-colors hover:bg-glow/10"
                  >
                    <Check size={12} />
                    Équipé · retirer
                  </button>
                )}
                {isOwned && !isEquipped && (
                  <button
                    type="button"
                    onClick={() => handleEquip(c)}
                    className="inline-flex items-center gap-2 rounded-md border border-forge-light bg-transparent px-4 py-2 text-xs uppercase tracking-[0.25em] text-cream transition-colors hover:border-glow hover:text-glow"
                  >
                    Équiper
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </section>

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
