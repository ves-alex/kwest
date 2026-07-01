import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, X, ShoppingBag } from 'lucide-react'
import ConfirmModal from '../components/ui/ConfirmModal'
import { COSMETICS, RARITIES, COSMETIC_TYPES, FOND_AVATAR_GRADIENTS } from '../domain/cosmetics'
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
    stripe: 'bg-ash/40',
    badge: 'bg-ash/15 text-ash',
  },
  forge: {
    border: 'border-ember/60',
    glow: 'shadow-[0_0_20px_-10px_rgba(124,45,18,0.9)]',
    stripe: 'bg-ember',
    badge: 'bg-ember/20 text-ember',
  },
  eveille: {
    border: 'border-glow/70',
    glow: 'shadow-[0_0_24px_-8px_rgba(146,64,14,0.7)]',
    stripe: 'bg-gradient-to-r from-glow to-ember',
    badge: 'bg-glow/20 text-glow',
  },
  ascendant: {
    border: 'border-cream/50',
    glow: 'shadow-[0_0_32px_-6px_rgba(245,240,232,0.25)]',
    stripe: 'bg-gradient-to-r from-cream via-glow to-ember',
    badge: 'bg-cream/15 text-cream',
  },
}

const SECTIONS = [
  { type: 'skin', label: 'Apparences' },
  { type: 'badge', label: 'Badges' },
  { type: 'fond-avatar', label: "Fonds d'avatar" },
  { type: 'aura', label: 'Auras' },
  { type: 'titre', label: 'Titres' },
  { type: 'fond', label: 'Fonds de page' },
]

function ItemPreview({ c, player, size = 'sm' }) {
  const smDim = size === 'sm'

  if (c.type === 'skin') {
    const dim = smDim ? 'h-16 w-16' : 'h-24 w-24'
    return (
      <div
        className={`${dim} relative overflow-hidden rounded-full border border-ember/30`}
        style={{
          background:
            FOND_AVATAR_GRADIENTS[player.cosmeticsEquipped?.['fond-avatar']] ??
            FOND_AVATAR_GRADIENTS.default,
        }}
      >
        <img
          src={`/avatars/${c.id}.png`}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    )
  }

  if (c.type === 'badge') {
    const dim = smDim ? 'h-16 w-16' : 'h-24 w-24'
    return (
      <div className={`${dim} relative overflow-hidden rounded-full border-2 border-forge-light/60 bg-charcoal/75`}>
        <img
          src={`/avatars/${c.id}.png`}
          alt=""
          className="absolute inset-0 h-full w-full object-contain p-1"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    )
  }

  if (c.type === 'fond-avatar') {
    const dim = smDim ? 'h-14 w-14' : 'h-20 w-20'
    return (
      <div
        className={`${dim} rounded-full border border-forge-light/60`}
        style={{ background: FOND_AVATAR_GRADIENTS[c.id] }}
      />
    )
  }

  if (c.type === 'aura') {
    const colors = {
      brut: '#d97706',
      forge: '#c2410c',
      eveille: '#b45309',
      ascendant: '#f5f0e8',
    }
    const color = colors[c.rarity] ?? '#d97706'
    const s = smDim ? 56 : 72
    return (
      <svg width={s} height={s} viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r="24" fill="none" stroke={color} strokeWidth="0.5" opacity="0.2" />
        <circle cx="28" cy="28" r="17" fill="none" stroke={color} strokeWidth="1" opacity="0.35" />
        <circle cx="28" cy="28" r="10" fill="none" stroke={color} strokeWidth="1.5" opacity="0.55" />
        <circle cx="28" cy="28" r="5" fill={color} opacity="0.45" />
      </svg>
    )
  }

  if (c.type === 'titre') {
    const colorClass = RARITIES[c.rarity].color
    const textSize = smDim ? 'text-[9px]' : 'text-xs'
    return (
      <div
        className={`flex ${smDim ? 'h-14 w-full' : 'h-20 w-full'} items-center justify-center rounded-lg border border-forge-light/30 bg-charcoal/40 px-2`}
      >
        <p className={`text-center ${textSize} font-medium italic leading-snug tracking-wide ${colorClass}`}>
          « {c.name} »
        </p>
      </div>
    )
  }

  // fond de page
  const colorClass = RARITIES[c.rarity].color
  return (
    <div
      className={`flex ${smDim ? 'h-14 w-full' : 'h-20 w-full'} items-center justify-center rounded-lg border border-forge-light/30 bg-charcoal/60`}
    >
      <p className={`text-[9px] uppercase tracking-[0.25em] ${colorClass}`}>Fond</p>
    </div>
  )
}

export default function Shop() {
  const [player, setPlayer] = useState(loadPlayer)
  const [pendingBuy, setPendingBuy] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const balance = getBalance(player)

  const confirmBuy = () => {
    if (!pendingBuy) return
    const next = buyCosmetic(pendingBuy.id, pendingBuy.price, pendingBuy.type)
    if (next) setPlayer(next)
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
                      className={`relative w-[132px] shrink-0 overflow-hidden rounded-2xl border bg-forge text-left transition-all active:scale-95 ${
                        isEquipped
                          ? 'border-glow'
                          : isOwned
                          ? 'border-forge-light/80'
                          : style.border
                      } ${!isOwned ? style.glow : ''}`}
                    >
                      <div className={`h-0.5 w-full ${style.stripe}`} aria-hidden />

                      <div className="flex min-h-[88px] flex-col items-center justify-center px-3 pt-3 pb-1.5">
                        <ItemPreview c={c} player={player} size="sm" />
                      </div>

                      <div className="px-3 pb-3">
                        <p className="line-clamp-2 text-[11px] font-medium leading-tight text-cream">
                          {c.name}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between gap-1">
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] uppercase tracking-[0.15em] ${style.badge}`}
                          >
                            {rarity.label}
                          </span>
                          {isEquipped ? (
                            <span className="flex items-center gap-0.5 text-glow">
                              <Check size={9} />
                              <span className="text-[8px] uppercase tracking-[0.1em]">Équipé</span>
                            </span>
                          ) : isOwned ? (
                            <span className="text-[8px] uppercase tracking-[0.1em] text-ash/50">
                              Possédé
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] text-ember">
                              {RUNE_SYMBOL}{c.price}
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

      {/* Detail bottom sheet */}
      <AnimatePresence>
        {selectedItem &&
          (() => {
            const c = selectedItem
            const style = RARITY_STYLES[c.rarity]
            const rarity = RARITIES[c.rarity]
            const isOwned = player.cosmeticsOwned.includes(c.id)
            const isEquipped = player.cosmeticsEquipped?.[c.type] === c.id
            const canAfford = balance >= c.price
            return (
              <motion.div
                key="sheet-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-charcoal/80 backdrop-blur-sm"
                onClick={() => setSelectedItem(null)}
              >
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', stiffness: 360, damping: 36 }}
                  className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-forge-light bg-forge px-6 pb-16 pt-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header sheet */}
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.25em] ${style.badge}`}
                      >
                        {rarity.label}
                      </span>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-ash/50">
                        {COSMETIC_TYPES[c.type]}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-forge-light text-ash transition-colors hover:border-ember hover:text-ember"
                      aria-label="Fermer"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* Preview + description */}
                  <div className="flex items-start gap-5">
                    <div className="shrink-0">
                      <ItemPreview c={c} player={player} size="lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-tight text-cream">{c.name}</p>
                      <p className="mt-3 text-xs leading-relaxed text-ash">{c.description}</p>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-6 flex items-center justify-between">
                    {!isOwned && (
                      <p className="font-display text-xl tracking-wider text-ember">
                        {RUNE_SYMBOL} {c.price}
                      </p>
                    )}
                    <div className={!isOwned ? '' : 'ml-auto'}>
                      {!isOwned && canAfford && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItem(null)
                            setPendingBuy(c)
                          }}
                          className="inline-flex items-center gap-2 rounded-md border border-ember bg-forge px-5 py-2.5 text-xs uppercase tracking-[0.25em] text-cream transition-colors hover:bg-ember/20"
                        >
                          <ShoppingBag size={13} className="text-ember" />
                          Acquérir
                        </button>
                      )}
                      {!isOwned && !canAfford && (
                        <div className="text-right">
                          <p className="text-xs text-ash/40 line-through">
                            {RUNE_SYMBOL} {c.price}
                          </p>
                          <p className="mt-0.5 text-[10px] text-ash/50">
                            {c.price - balance} {RUNE_SYMBOL} manquantes
                          </p>
                        </div>
                      )}
                      {isOwned && isEquipped && (
                        <button
                          type="button"
                          onClick={() => handleUnequip(c.type)}
                          className="inline-flex items-center gap-2 rounded-md border border-glow bg-forge px-5 py-2.5 text-xs uppercase tracking-[0.25em] text-glow transition-colors hover:bg-glow/10"
                        >
                          <Check size={13} />
                          Équipé · retirer
                        </button>
                      )}
                      {isOwned && !isEquipped && (
                        <button
                          type="button"
                          onClick={() => handleEquip(c)}
                          className="inline-flex items-center gap-2 rounded-md border border-forge-light px-5 py-2.5 text-xs uppercase tracking-[0.25em] text-cream transition-colors hover:border-glow hover:text-glow"
                        >
                          Équiper
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )
          })()}
      </AnimatePresence>

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
