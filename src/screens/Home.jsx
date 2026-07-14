import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Flame, Settings as SettingsIcon, Sun, Moon, Star } from 'lucide-react'
import { loadPlayer, getBalance } from '../storage/player'
import { loadSessions } from '../storage/sessions'
import { computeLevel, RUNE_SYMBOL } from '../domain/economy'
import { computeWeeklyStats } from '../domain/streak'
import { loadTheme, toggleTheme } from '../lib/theme'
import { findCosmeticById } from '../domain/cosmetics'
import { BADGES, findBadgeById } from '../domain/badges'
import PixelAvatar from '../components/ui/PixelAvatar'
import FloatingBadges from '../components/ui/FloatingBadges'
import Dressing from './home/Dressing'

export default function Home() {
  const [player, setPlayer] = useState(loadPlayer)
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [dressingOpen, setDressingOpen] = useState(false)
  const refugeFrameRef = useRef(null)
  const [frameDims, setFrameDims] = useState(null)
  const [theme, setThemeState] = useState(loadTheme)

  const handleToggleTheme = () => {
    setThemeState(toggleTheme())
  }
  useEffect(() => {
    const el = refugeFrameRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setFrameDims({ w: Math.round(width), h: Math.round(height) })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const balance = getBalance(player)
  const lvl = computeLevel(player.totalXp)
  const unlocked = new Set(player.badgesUnlocked ?? [])
  const equippedTitle = findCosmeticById(player.cosmeticsEquipped?.titre)

  const sessions = useMemo(() => loadSessions(), [player.totalRunes])
  const weekly = useMemo(() => computeWeeklyStats(sessions), [sessions])
  const goal = player.weeklyGoal ?? 3
  const weekPct = Math.min(1, weekly.weekSessions / goal)

  return (
    <>
      <div className="py-8 px-4">

        {/* Cadre Refuge — scène des badges flottants */}
        <div
          ref={refugeFrameRef}
          className="relative overflow-hidden rounded-2xl border border-forge-light/60 bg-forge/30"
        >
          {/* Coins ember décoratifs — 3 coins + engrenage/toggle groupés au 4e (haut-droite) */}
          <span className="pointer-events-none absolute left-3 top-3 h-6 w-6 rounded-tl border-l-2 border-t-2 border-ember/50" />
          <span className="pointer-events-none absolute bottom-3 left-3 h-6 w-6 rounded-bl border-b-2 border-l-2 border-ember/50" />
          <span className="pointer-events-none absolute bottom-3 right-3 h-6 w-6 rounded-br border-b-2 border-r-2 border-ember/50" />

          {/* Engrenage + toggle thème empilés dans le coin haut-droit */}
          <Link
            to="/settings"
            className="absolute right-3 top-3 z-[4] flex h-8 w-8 items-center justify-center rounded-full border border-ember/50 bg-charcoal/60 text-ash/80 transition-colors hover:border-ember hover:bg-charcoal hover:text-ember"
            aria-label="Paramètres"
          >
            <SettingsIcon size={15} className="translate-y-[0.5px]" />
          </Link>

          <button
            type="button"
            onClick={handleToggleTheme}
            className="absolute right-3 top-14 z-[4] flex h-8 w-8 items-center justify-center rounded-full border border-ember/50 bg-charcoal/60 text-ash/80 transition-colors hover:border-ember hover:bg-charcoal hover:text-ember"
            aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {theme === 'dark' ? (
              <Sun size={15} className="translate-y-[0.5px]" />
            ) : (
              <Moon size={15} className="translate-y-[0.5px]" />
            )}
          </button>

          <div className="px-6 pb-10 pt-10 text-center">
            <header>
              <p className="text-[10px] uppercase tracking-[0.4em] text-ash">ton refuge</p>
              <h1 className="mt-3 font-display text-4xl uppercase tracking-[0.15em] text-cream sm:text-5xl sm:tracking-[0.2em]">
                Refuge
              </h1>
            </header>

            {/* Avatar — cliquable pour ouvrir le dressing */}
            <div className="mt-10 flex justify-center">
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
                  pixelSize={8}
                />
                <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border border-forge-light bg-forge text-ash transition-colors group-hover:border-ember group-hover:text-ember">
                  <Pencil size={11} />
                </span>
              </button>
            </div>

            <p className="mt-4 font-display text-lg uppercase tracking-[0.25em] text-cream">
              {lvl.title}
            </p>
            {/* Étoiles de forge — prestige permanent, forgé dans l'Atelier */}
            {(player.prestigeStars ?? 0) > 0 && (
              <p
                className="mt-1.5 flex items-center justify-center gap-1 text-glow"
                aria-label={`${player.prestigeStars} étoile${player.prestigeStars > 1 ? 's' : ''} de forge`}
              >
                {player.prestigeStars <= 5 ? (
                  Array.from({ length: player.prestigeStars }).map((_, i) => (
                    <Star key={i} size={11} fill="currentColor" />
                  ))
                ) : (
                  <>
                    <Star size={11} fill="currentColor" />
                    <span className="font-mono text-[10px]">× {player.prestigeStars}</span>
                  </>
                )}
              </p>
            )}
            {equippedTitle && (
              <p className="mt-1 text-xs italic tracking-wider text-glow">
                « {equippedTitle.name} »
              </p>
            )}
          </div>

          {frameDims && (
            <FloatingBadges
              ownedIds={player.cosmeticsOwned}
              zoneW={frameDims.w}
              zoneH={frameDims.h}
            />
          )}
        </div>

        <section className="mx-auto mt-6 max-w-md space-y-4">
          {/* Cette semaine — streak hebdo */}
          <div className="rounded-2xl border border-forge-light bg-forge p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-[10px] uppercase tracking-[0.3em] text-ash">Cette semaine</p>
              <p className="font-mono text-[10px] text-ash">
                {weekly.weekSessions} / {goal}
              </p>
            </div>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-charcoal">
              <div
                className="h-full bg-ember transition-all"
                style={{ width: `${weekPct * 100}%` }}
              />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Flame
                size={14}
                className={weekly.streak > 0 ? 'text-ember' : 'text-ash/40'}
                strokeWidth={weekly.streak > 0 ? 2 : 1.5}
              />
              <p className={`text-xs ${weekly.streak > 0 ? 'text-cream' : 'text-ash/70'}`}>
                {weekly.streak > 0
                  ? `Chaîne · ${weekly.streak} semaine${weekly.streak > 1 ? 's' : ''}`
                  : 'Chaîne à démarrer'}
              </p>
              {weekly.recordStreak > 0 && weekly.recordStreak > weekly.streak && (
                <p className="ml-auto font-mono text-[10px] text-ash/50">
                  record · {weekly.recordStreak}
                </p>
              )}
            </div>
          </div>

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
            <ul className="mt-4 grid grid-cols-5 gap-2">
              {BADGES.map((b) => {
                const Icon = b.Icon
                const isUnlocked = unlocked.has(b.id)
                const isSelected = selectedBadge === b.id
                return (
                  <li key={b.id}>
                    <button
                      type="button"
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

      </div>

      <Dressing
        isOpen={dressingOpen}
        player={player}
        onClose={() => setDressingOpen(false)}
        onChange={setPlayer}
      />

    </>
  )
}
