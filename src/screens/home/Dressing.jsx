import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { COSMETICS, COSMETIC_TYPES, FOND_AVATAR_GRADIENTS, findCosmeticById } from '../../domain/cosmetics'
import { equipCosmetic, unequipCosmetic } from '../../storage/player'
import PixelAvatar from '../../components/ui/PixelAvatar'

const DRESSING_TYPES = ['skin', 'fond-avatar', 'aura', 'titre', 'fond']

export default function Dressing({ isOpen, player, onClose, onChange }) {
  const equippedTitle = findCosmeticById(player.cosmeticsEquipped?.titre)

  const ownedByType = Object.fromEntries(
    DRESSING_TYPES.map((type) => [
      type,
      COSMETICS.filter((c) => c.type === type && player.cosmeticsOwned.includes(c.id)),
    ])
  )
  const hasDressing = DRESSING_TYPES.some((t) => ownedByType[t].length > 0)

  function handleTryOn(type, id) {
    if (player.cosmeticsEquipped?.[type] === id) {
      onChange?.(unequipCosmetic(type))
    } else {
      onChange?.(equipCosmetic(type, id))
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
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
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-forge-light bg-forge px-6 pb-16 pt-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.3em] text-ash">Dressing</p>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-forge-light text-ash transition-colors hover:border-ember hover:text-ember"
                aria-label="Fermer"
              >
                <X size={13} />
              </button>
            </div>

            {/* Aperçu avatar en temps réel */}
            <div className="flex justify-center">
              <PixelAvatar
                auraId={player.cosmeticsEquipped?.aura}
                skinId={player.cosmeticsEquipped?.skin}
                fondId={player.cosmeticsEquipped?.['fond-avatar']}
                pixelSize={5}
              />
            </div>
            {equippedTitle && (
              <p className="mt-2 text-center text-xs italic tracking-wider text-glow">
                « {equippedTitle.name} »
              </p>
            )}

            {!hasDressing && (
              <p className="mt-6 text-center text-[10px] uppercase tracking-[0.3em] text-ash/50">
                aucun cosmétique possédé · visite l'atelier
              </p>
            )}

            {DRESSING_TYPES.map((type) => {
              const owned = ownedByType[type]
              if (owned.length === 0) return null
              const equippedId = player.cosmeticsEquipped?.[type]

              return (
                <div key={type} className="mt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] uppercase tracking-[0.25em] text-ash/50">
                      {COSMETIC_TYPES[type]}
                    </p>
                    {equippedId && (
                      <button
                        type="button"
                        onClick={() => onChange?.(unequipCosmetic(type))}
                        className="text-[9px] uppercase tracking-[0.2em] text-ash/40 transition-colors hover:text-ash"
                      >
                        retirer
                      </button>
                    )}
                  </div>

                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                    {owned.map((c) => {
                      const isEquipped = equippedId === c.id
                      const ringClass = isEquipped
                        ? 'ring-2 ring-ember ring-offset-2 ring-offset-forge'
                        : ''

                      if (type === 'skin') {
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleTryOn(type, c.id)}
                            aria-label={c.name}
                            aria-pressed={isEquipped}
                            className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-ember/30 transition-all ${ringClass}`}
                            style={{
                              background:
                                FOND_AVATAR_GRADIENTS[player.cosmeticsEquipped?.['fond-avatar']] ??
                                FOND_AVATAR_GRADIENTS.default,
                            }}
                          >
                            <img
                              src={`/avatars/${c.id}.png`}
                              alt={c.name}
                              className="absolute inset-0 h-full w-full object-contain"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          </button>
                        )
                      }

                      if (type === 'fond-avatar') {
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleTryOn(type, c.id)}
                            aria-label={c.name}
                            aria-pressed={isEquipped}
                            className={`h-12 w-12 flex-shrink-0 rounded-full border border-forge-light/60 transition-all ${ringClass}`}
                            style={{ background: FOND_AVATAR_GRADIENTS[c.id] }}
                          />
                        )
                      }

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleTryOn(type, c.id)}
                          aria-pressed={isEquipped}
                          className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-all ${
                            isEquipped
                              ? 'border-ember bg-ember/15 text-cream'
                              : 'border-forge-light bg-transparent text-ash hover:border-ash/60'
                          }`}
                        >
                          {c.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
