import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Anvil } from 'lucide-react'
import { loadPlayer, getBalance } from '../storage/player'
import { computeLevel, RUNE_SYMBOL } from '../domain/economy'
import { loadActiveSession } from '../storage/sessions'
import { findCosmeticById } from '../domain/cosmetics'
import { BADGES, findBadgeById } from '../domain/badges'
import PixelAvatar from '../components/ui/PixelAvatar'

export default function Home() {
  const navigate = useNavigate()
  const [player] = useState(loadPlayer)
  const [hasActive] = useState(() => !!loadActiveSession())
  const [selectedBadge, setSelectedBadge] = useState(null)
  const balance = getBalance(player)
  const lvl = computeLevel(player.totalXp)
  const unlocked = new Set(player.badgesUnlocked ?? [])

  const equippedTitle = findCosmeticById(player.cosmeticsEquipped?.titre)

  return (
    <div className="px-6 py-10">
      <header className="mx-auto max-w-md text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-ash">
          ton refuge
        </p>
        <h1 className="mt-3 font-display text-4xl uppercase tracking-[0.15em] text-cream sm:text-5xl sm:tracking-[0.2em]">
          Refuge
        </h1>
      </header>

      <div className="mx-auto mt-10 flex justify-center">
        <PixelAvatar
          level={lvl.level}
          auraId={player.cosmeticsEquipped?.aura}
          skinId={player.cosmeticsEquipped?.skin}
          pixelSize={8}
        />
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

        <div className="rounded-2xl border border-forge-light bg-forge p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ash">
            Solde
          </p>
          <p className="mt-2 font-display text-4xl tracking-wider text-ember">
            {RUNE_SYMBOL} {balance}
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-ash">
            runes d'effort
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/session')}
          className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-md border border-ember bg-forge px-6 py-3.5 text-sm uppercase tracking-[0.25em] text-cream transition-all hover:bg-ember/20 hover:shadow-[0_0_24px_-8px_rgba(146,64,14,0.8)] active:scale-95"
        >
          {hasActive ? (
            <Anvil size={18} className="text-ember" />
          ) : (
            <Flame size={18} className="text-ember" />
          )}
          {hasActive ? 'Reprendre la séance' : 'Démarrer une séance'}
        </button>

        {/* Annales — badges narratifs */}
        <div className="mt-6 rounded-2xl border border-forge-light bg-forge p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] uppercase tracking-[0.3em] text-ash">
              Annales
            </p>
            <p className="font-mono text-[10px] text-ash">
              {unlocked.size} / {BADGES.length}
            </p>
          </div>
          <ul className="mt-4 grid grid-cols-5 gap-2">
            {BADGES.map((b) => {
              const Icon = b.Icon
              const isUnlocked = unlocked.has(b.id)
              const isSelected = selectedBadge === b.id
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedBadge(isSelected ? null : b.id)
                    }
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

          {/* Détail du badge sélectionné */}
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
                ? 'aucune annale encore · tape un sceau pour sa condition'
                : 'tape un sceau pour son détail'}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
