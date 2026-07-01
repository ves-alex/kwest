import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { findCosmeticById } from '../../domain/cosmetics'

const RARITY_BORDER = {
  brut:      'border-forge-light/70',
  forge:     'border-ember/80',
  eveille:   'border-glow/80',
  ascendant: 'border-cream/60',
}

const RARITY_GLOW = {
  brut:      '',
  forge:     'shadow-[0_0_14px_-4px_rgba(124,45,18,0.7)]',
  eveille:   'shadow-[0_0_18px_-4px_rgba(146,64,14,0.8)]',
  ascendant: 'shadow-[0_0_22px_-4px_rgba(245,240,232,0.35)]',
}

// Durée de dérive par badge (légèrement différente pour éviter la synchronisation)
const DURATIONS = [6.5, 8.2, 7.1, 9.4, 7.8, 8.8]

function BadgeBubble({ cosmetic, initialX, initialY, duration, maxY }) {
  const [target, setTarget] = useState({ x: initialX, y: initialY })

  const drift = useCallback(() => {
    const margin = 60
    const bottomBound = maxY > 0 ? maxY - 48 : window.innerHeight * 0.5
    setTarget({
      x: margin + Math.random() * (window.innerWidth - margin * 2),
      y: margin + Math.random() * Math.max(0, bottomBound - margin),
    })
  }, [maxY])

  return (
    <motion.div
      className={[
        'pointer-events-none fixed z-[3]',
        'flex h-12 w-12 items-center justify-center',
        'overflow-hidden rounded-full border-2',
        'bg-charcoal/75 backdrop-blur-[2px]',
        RARITY_BORDER[cosmetic.rarity] ?? 'border-forge-light/70',
        RARITY_GLOW[cosmetic.rarity]   ?? '',
      ].join(' ')}
      style={{ left: 0, top: 0 }}
      initial={{ x: initialX, y: initialY, opacity: 0 }}
      animate={{ x: target.x, y: target.y, opacity: 0.82 }}
      transition={{ duration, ease: [0.4, 0, 0.6, 1] }}
      onAnimationComplete={drift}
    >
      <img
        src={`/avatars/${cosmetic.id}.png`}
        alt={cosmetic.name}
        className="h-10 w-10 object-contain p-0.5"
        style={{ imageRendering: 'pixelated' }}
      />
    </motion.div>
  )
}

export default function FloatingBadges({ ownedIds, maxY = 0 }) {
  const badges = (ownedIds ?? [])
    .map((id) => findCosmeticById(id))
    .filter((c) => c?.type === 'badge')

  if (badges.length === 0) return null

  const vw = typeof window !== 'undefined' ? window.innerWidth  : 390
  // Zone initiale : autour de l'avatar (centre de la moitié haute)
  const zoneMidY = maxY > 0 ? maxY / 2 : 220

  return (
    <>
      {badges.map((badge, i) => {
        // Positions initiales réparties en cercle autour du centre avatar
        const angle = (i / badges.length) * Math.PI * 2 - Math.PI / 2
        const r = Math.min(vw, zoneMidY) * 0.35
        const initialX = vw / 2 + Math.cos(angle) * r - 24
        const initialY = zoneMidY + Math.sin(angle) * r - 24

        return (
          <BadgeBubble
            key={badge.id}
            cosmetic={badge}
            initialX={initialX}
            initialY={initialY}
            duration={DURATIONS[i % DURATIONS.length]}
            maxY={maxY}
          />
        )
      })}
    </>
  )
}
