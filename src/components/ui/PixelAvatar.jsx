import { FOND_AVATAR_GRADIENTS } from '../../domain/cosmetics'

const AURA_SHADOWS = {
  'aura-ember': '0 0 36px 10px rgba(124,45,18,0.85), 0 0 70px 20px rgba(124,45,18,0.3)',
  'aura-glow':  '0 0 44px 14px rgba(146,64,14,0.95), 0 0 90px 24px rgba(251,191,36,0.3)',
}

export default function PixelAvatar({ auraId, skinId, fondId, pixelSize = 6 }) {
  const svgDim = 16 * pixelSize
  const containerDim = svgDim + 32
  const glow = auraId ? (AURA_SHADOWS[auraId] ?? undefined) : undefined

  const circleBackground = skinId
    ? (FOND_AVATAR_GRADIENTS[fondId] ?? FOND_AVATAR_GRADIENTS.default)
    : '#1A1614'

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
      <div
        className="absolute rounded-full border border-forge-light/35"
        style={{ inset: 6 }}
        aria-hidden
      />

      {/* Cercle de fond avec gradient */}
      <div
        className="absolute overflow-hidden rounded-full border border-ember/30"
        style={{ inset: 16, boxShadow: glow, background: circleBackground }}
        aria-hidden
      >
        {skinId && (
          <img
            src={`/avatars/${skinId}.png`}
            alt="Avatar"
            className="h-full w-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
      </div>
    </div>
  )
}
