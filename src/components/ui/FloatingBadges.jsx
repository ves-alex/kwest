import { useState, useCallback, useEffect } from 'react'
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

const DURATIONS = [10, 13, 11, 15, 12, 14]

function BadgeBubble({ cosmetic, initialX, initialY, duration, stageW, stageH }) {
  const [target, setTarget] = useState({ x: initialX, y: initialY })

  const drift = useCallback(() => {
    const margin = 20
    const bubble = 48
    setTarget({
      x: margin + Math.random() * Math.max(0, stageW - bubble - margin * 2),
      y: margin + Math.random() * Math.max(0, stageH - bubble - margin * 2),
    })
  }, [stageW, stageH])

  useEffect(() => {
    drift()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className={[
        'pointer-events-none absolute',
        'flex h-12 w-12 items-center justify-center',
        'overflow-hidden rounded-full border-2',
        'bg-charcoal/75 backdrop-blur-[2px]',
        RARITY_BORDER[cosmetic.rarity] ?? 'border-forge-light/70',
        RARITY_GLOW[cosmetic.rarity]   ?? '',
      ].join(' ')}
      style={{ left: 0, top: 0 }}
      initial={{ x: initialX, y: initialY, opacity: 0 }}
      animate={{ x: target.x, y: target.y, opacity: 0.82 }}
      transition={{
        x: { duration, ease: [0.4, 0, 0.6, 1] },
        y: { duration, ease: [0.4, 0, 0.6, 1] },
        opacity: { duration: 0.6 },
      }}
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

export default function FloatingBadges({ ownedIds }) {
  const badges = (ownedIds ?? [])
    .map((id) => findCosmeticById(id))
    .filter((c) => c?.type === 'badge')

  if (badges.length === 0) return null

  // Scène fixe en haut de l'écran — overflow hidden = les bulles ne débordent jamais
  const stageW = typeof window !== 'undefined' ? window.innerWidth  : 390
  const stageH = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.44) : 290

  const cx = stageW / 2
  const cy = stageH * 0.52

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[3] overflow-hidden"
      style={{ height: stageH }}
    >
      {badges.map((badge, i) => {
        const angle = (i / badges.length) * Math.PI * 2 - Math.PI / 2
        const r = Math.min(stageW * 0.32, stageH * 0.42)
        const initialX = cx + Math.cos(angle) * r - 24
        const initialY = cy + Math.sin(angle) * r - 24

        return (
          <BadgeBubble
            key={badge.id}
            cosmetic={badge}
            initialX={initialX}
            initialY={initialY}
            duration={DURATIONS[i % DURATIONS.length]}
            stageW={stageW}
            stageH={stageH}
          />
        )
      })}
    </div>
  )
}
