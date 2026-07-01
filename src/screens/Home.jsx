import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Pencil, X, LogOut } from 'lucide-react'
import { loadPlayer, getBalance, equipCosmetic, unequipCosmetic } from '../storage/player'
import { computeLevel, RUNE_SYMBOL } from '../domain/economy'
import { supabase } from '../lib/supabase'
import {
  findCosmeticById,
  COSMETICS,
  COSMETIC_TYPES,
  FOND_AVATAR_GRADIENTS,
} from '../domain/cosmetics'
import { BADGES, findBadgeById } from '../domain/badges'
import PixelAvatar from '../components/ui/PixelAvatar'

const DRESSING_TYPES = ['skin', 'chapeau', 'arme', 'fond-avatar', 'aura', 'titre', 'fond']

export default function Home() {
  const [player, setPlayer] = useState(loadPlayer)
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [dressingOpen, setDressingOpen] = useState(false)
  const [authUser, setAuthUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthUser(data.user ?? null))
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    localStorage.clear()
  }

  const balance = getBalance(player)
  const lvl = computeLevel(player.totalXp)
  const unlocked = new Set(player.badgesUnlocked ?? [])
  const equippedTitle = findCosmeticById(player.cosmeticsEquipped?.titre)

  function handleTryOn(type, id) {
    if (player.cosmeticsEquipped?.[type] === id) {
      setPlayer(unequipCosmetic(type))
    } else {
      setPlayer(equipCosmetic(type, id))
    }
  }

  const ownedByType = Object.fromEntries(
    DRESSING_TYPES.map((type) => [
      type,
      COSMETICS.filter((c) => c.type === type && player.cosmeticsOwned.includes(c.id)),
    ])
  )
  const hasDressing = DRESSING_TYPES.some((t) => ownedByType[t].length > 0)

  return (
    <>
      <div className="px-6 py-10">
        <header className="mx-auto max-w-md text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-ash">ton refuge</p>
          <h1 className="mt-3 font-display text-4xl uppercase tracking-[0.15em] text-cream sm:text-5xl sm:tracking-[0.2em]">
            Refuge
          </h1>
        </header>

        {/* Avatar — cliquable pour ouvrir le dressing */}
        <div className="mx-auto mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setDressingOpen(true)}
            className="group relative"
            aria-label="Ouvrir le dressing"
          >
            <PixelAvatar
              auraId={player.cosmeticsEquipped?.aura}
              skinId={player.cosmeticsEquipped?.skin}
              fondId={player.cosmeticsEquipped?.['fond-avatar']}
              hatId={player.cosmeticsEquipped?.chapeau}
              weaponId={player.cosmeticsEquipped?.arme}
              pixelSize={8}
            />
            <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border border-forge-light bg-forge text-ash transition-colors group-hover:border-ember group-hover:text-ember">
              <Pencil size={11} />
            </span>
          </button>
        </div>

        <p className="mt-4 text-center font-display text-lg uppercase tracking-[0.25em] text-cream">
          {lvl.title}
        </p>
        {equippedTitle && (
          <p className="mt-1 text-center text-xs italic tracking-wider text-glow">
            « {equippedTitle.name} »
          </p>
        )}

        <section className="mx-auto mt-10 max-w-md space-y-4">
          {/* Niveau */}
          <div className="rounded-2xl border border-forge-light bg-forge p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-[10px] uppercase tracking-[0.3em] text-ash">
                Niveau {lvl.level}
              </p>
              {lvl.nextThreshold && (
                <p className="font-mono text-[10px] text-ash">
                  {player.totalXp} / {lvl.nextThreshold}
                </p>
              )}
            </div>
            {lvl.nextTitle ? (
              <>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-charcoal">
                  <div
                    className="h-full bg-ember transition-all"
                    style={{ width: `${lvl.progress * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-ash">
                  prochain palier →{' '}
                  <span className="text-cream">{lvl.nextTitle}</span>
                </p>
              </>
            ) : (
              <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-ember">
                palier ultime atteint
              </p>
            )}
          </div>

          {/* Solde */}
          <div className="rounded-2xl border border-forge-light bg-forge p-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-ash">Solde</p>
            <p className="mt-2 font-display text-4xl tracking-wider text-ember">
              {RUNE_SYMBOL} {balance}
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-ash">
              runes d'effort
            </p>
          </div>

          {/* Annales — badges narratifs */}
          <div className="rounded-2xl border border-forge-light bg-forge p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-[10px] uppercase tracking-[0.3em] text-ash">Annales</p>
              <p className="font-mono text-[10px] text-ash">
                {unlocked.size} / {BADGES.length}
              </p>
            </div>
            <ul
              className="mt-4 grid grid-cols-5 gap-2"
              onTouchStart={(e) => {
                const t = e.touches[0]
                const el = document.elementFromPoint(t.clientX, t.clientY)
                const btn = el?.closest('[data-badge-id]')
                if (btn) setSelectedBadge(btn.dataset.badgeId)
              }}
              onTouchMove={(e) => {
                const t = e.touches[0]
                const el = document.elementFromPoint(t.clientX, t.clientY)
                const btn = el?.closest('[data-badge-id]')
                if (btn) setSelectedBadge(btn.dataset.badgeId)
              }}
            >
              {BADGES.map((b) => {
                const Icon = b.Icon
                const isUnlocked = unlocked.has(b.id)
                const isSelected = selectedBadge === b.id
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      data-badge-id={b.id}
                      onClick={() => setSelectedBadge(isSelected ? null : b.id)}
                      onMouseEnter={() => setSelectedBadge(b.id)}
                      aria-label={b.name}
                      aria-pressed={isSelected}
                      className={`flex aspect-square w-full items-center justify-center rounded-lg border transition-all ${
                        isUnlocked
                          ? 'border-glow bg-forge'
                          : 'border-forge-light bg-charcoal/40'
                      } ${
                        isSelected
                          ? 'ring-2 ring-ember ring-offset-2 ring-offset-forge'
                          : ''
                      }`}
                    >
                      <Icon
                        size={20}
                        className={isUnlocked ? 'text-glow' : 'text-ash/40'}
                      />
                    </button>
                  </li>
                )
              })}
            </ul>

            {selectedBadge &&
              (() => {
                const b = findBadgeById(selectedBadge)
                if (!b) return null
                const isUnlocked = unlocked.has(b.id)
                const Icon = b.Icon
                return (
                  <div className="mt-4 rounded-lg border border-forge-light bg-charcoal/40 p-3">
                    <div className="flex items-center gap-2">
                      <Icon
                        size={16}
                        className={isUnlocked ? 'text-glow' : 'text-ash'}
                      />
                      <p className="text-sm font-medium text-cream">{b.name}</p>
                      {isUnlocked && (
                        <span className="ml-auto text-[9px] uppercase tracking-[0.2em] text-glow">
                          ✓ débloqué
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-ash">
                      {b.description}
                    </p>
                  </div>
                )
              })()}

            {!selectedBadge && (
              <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-ash">
                {unlocked.size === 0
                  ? 'aucune annale encore · glisse sur un sceau pour sa condition'
                  : 'glisse sur un sceau pour son détail'}
              </p>
            )}
          </div>
        </section>

        {/* Profil + déconnexion */}
        {authUser && (
          <div className="mx-auto mt-6 max-w-md">
            <div className="flex items-center justify-between rounded-2xl border border-forge-light bg-forge px-4 py-3">
              <div className="flex items-center gap-3">
                {authUser.user_metadata?.avatar_url ? (
                  <img
                    src={authUser.user_metadata.avatar_url}
                    alt=""
                    className="h-8 w-8 rounded-full border border-forge-light"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-forge-light bg-charcoal text-xs text-ash">
                    {authUser.email?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs text-cream">
                    {authUser.user_metadata?.full_name ?? authUser.email}
                  </p>
                  <p className="truncate text-[10px] text-ash/60">{authUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-md border border-forge-light px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-ash transition-colors hover:border-ember hover:text-ember"
                aria-label="Se déconnecter"
              >
                <LogOut size={11} />
                Quitter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dressing — bottom sheet animé */}
      <AnimatePresence>
        {dressingOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-charcoal/80 backdrop-blur-sm"
          onClick={() => setDressingOpen(false)}
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
                onClick={() => setDressingOpen(false)}
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
                hatId={player.cosmeticsEquipped?.chapeau}
                weaponId={player.cosmeticsEquipped?.arme}
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
                        onClick={() => setPlayer(unequipCosmetic(type))}
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
                                FOND_AVATAR_GRADIENTS[
                                  player.cosmeticsEquipped?.['fond-avatar']
                                ] ?? FOND_AVATAR_GRADIENTS.default,
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

                      if (type === 'chapeau' || type === 'arme') {
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleTryOn(type, c.id)}
                            aria-label={c.name}
                            aria-pressed={isEquipped}
                            className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-forge-light/60 bg-charcoal transition-all ${ringClass}`}
                          >
                            <img
                              src={`/avatars/${c.id}.png`}
                              alt={c.name}
                              className="absolute inset-0 h-full w-full object-contain p-1"
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
    </>
  )
}
