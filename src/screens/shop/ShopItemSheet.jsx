import { AnimatePresence, motion } from 'motion/react'
import { Check, X, ShoppingBag } from 'lucide-react'
import { RARITIES, COSMETIC_TYPES } from '../../domain/cosmetics'
import { RARITY_STYLES } from '../../theme/rarity'
import { RUNE_SYMBOL } from '../../domain/economy'
import ItemPreview from './ItemPreview'

export default function ShopItemSheet({ item, player, balance, onClose, onBuyRequest, onEquip, onUnequip }) {
  return (
    <AnimatePresence>
      {item && (() => {
        const c = item
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
            onClick={onClose}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 36 }}
              className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-forge-light bg-forge px-6 pb-16 pt-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.25em] ${style.badge}`}
                  >
                    <span className={`text-[11px] leading-none ${style.text}`}>{style.symbol}</span>
                    {rarity.label}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-ash/50">
                    {COSMETIC_TYPES[c.type]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
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
                      onClick={() => onBuyRequest(c)}
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
                      onClick={() => onUnequip(c.type)}
                      className="inline-flex items-center gap-2 rounded-md border border-glow bg-forge px-5 py-2.5 text-xs uppercase tracking-[0.25em] text-glow transition-colors hover:bg-glow/10"
                    >
                      <Check size={13} />
                      Équipé · retirer
                    </button>
                  )}
                  {isOwned && !isEquipped && (
                    <button
                      type="button"
                      onClick={() => onEquip(c)}
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
  )
}
