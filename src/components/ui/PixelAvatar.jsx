import { motion } from 'motion/react'
import { FOND_AVATAR_GRADIENTS } from '../../domain/cosmetics'

const AURA_SHADOWS = {
  'aura-ember': '0 0 36px 10px rgba(124,45,18,0.85), 0 0 70px 20px rgba(124,45,18,0.3)',
  'aura-glow':  '0 0 44px 14px rgba(146,64,14,0.95), 0 0 90px 24px rgba(251,191,36,0.3)',
}

/**
 * Couches rendues (de bas en haut) :
 *   1. Gradient fond-avatar (ou défaut braise)
 *   2. Skin PNG (fond transparent après découpe)
 *   3. [futur] Cosmétiques superposés : chapeau, arme, accessoire…
 *
 * Chaque couche est un <img> positionné en absolute h-full w-full object-contain.
 * Pour ajouter un type (ex: "chapeau"), passer `hatId` et ajouter un bloc identique.
 */
export default function PixelAvatar({ auraId, skinId, fondId, hatId, weaponId, pixelSize = 6 }) {
  const svgDim = 16 * pixelSize
  const containerDim = svgDim + 32
  const glow = auraId ? (AURA_SHADOWS[auraId] ?? undefined) : undefined
  const background = FOND_AVATAR_GRADIENTS[fondId] ?? FOND_AVATAR_GRADIENTS.default

  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      style={{ width: containerDim, height: containerDim }}
    >
      {/* Anneaux décoratifs concentriques */}
      <div
        className="absolute rounded-full border border-forge-light/20"
        style={{ inset: 0 }}
        aria-hidden
      />
      <motion.div
        className="absolute rounded-full border border-forge-light"
        style={{ inset: 6, opacity: 0.35 }}
        animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.015, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />

      {/* Cercle — gradient de fond */}
      <div
        className="absolute overflow-hidden rounded-full border border-ember/30"
        style={{ inset: 16, boxShadow: glow, background }}
        aria-hidden
      >
        {/* Couche 1 : skin */}
        {skinId && (
          <img
            src={`/avatars/${skinId}.png`}
            alt="Avatar"
            className="absolute inset-0 h-full w-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
        {/* Couche 2 : chapeau */}
        {hatId && (
          <img
            src={`/avatars/${hatId}.png`}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
        {/* Couche 3 : arme */}
        {weaponId && (
          <img
            src={`/avatars/${weaponId}.png`}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
      </div>
    </div>
  )
}
