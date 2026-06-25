// Pixel art 16×16, chaque caractère = 1 pixel coloré, _ = transparent
const CHAR_DESIGN = [
  '________________',
  '____HHHHHH______',
  '___HSSSSSSH_____',
  '___HSESSESH_____',
  '___HSSSSSSH_____',
  '___HSSMMSH______',
  '____HHHHHH______',
  '___HBBBBBBH_____',
  '__HBBAAAABBH____',
  '__HBBAAAABBH____',
  '__HBBBBBBBBH____',
  '___HBBBBBBH_____',
  '____LL_LL_______',
  '____LL_LL_______',
  '____FF_FF_______',
  '________________',
]

// E=eye M=mouth S=skin H=helmet/hair B=body/armor A=accent L=leg F=foot
const PALETTES = [
  // Palier 0 (levels 0–1) : ash warrior
  { H: '#4A4540', S: '#C8956C', E: '#1A1614', M: '#9A7050', B: '#2A2420', A: '#3C3028', L: '#222018', F: '#1A1614' },
  // Palier 1 (levels 2–3) : ember forge
  { H: '#7C2D12', S: '#C8956C', E: '#0A0908', M: '#9A7050', B: '#7C2D12', A: '#B85A30', L: '#5A2008', F: '#3A1405' },
  // Palier 2 (levels 4–5) : cream legendary
  { H: '#F5F0E8', S: '#C8956C', E: '#0A0908', M: '#9A7050', B: '#92400E', A: '#F5F0E8', L: '#7C2D12', F: '#2A2420' },
]

const AURA_SHADOWS = {
  'aura-ember': '0 0 36px 10px rgba(124,45,18,0.85), 0 0 70px 20px rgba(124,45,18,0.3)',
  'aura-glow':  '0 0 44px 14px rgba(146,64,14,0.95), 0 0 90px 24px rgba(251,191,36,0.3)',
}

function getPalette(level) {
  if (level <= 1) return PALETTES[0]
  if (level <= 3) return PALETTES[1]
  return PALETTES[2]
}

export default function PixelAvatar({ level = 0, auraId, pixelSize = 6 }) {
  const palette = getPalette(level)
  const svgDim = 16 * pixelSize       // 96px
  const containerDim = svgDim + 32    // 128px (espace pour les anneaux)
  const glow = auraId ? (AURA_SHADOWS[auraId] ?? undefined) : undefined

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

      {/* Fond circulaire avec halo aura */}
      <div
        className="absolute rounded-full bg-forge border border-ember/30"
        style={{ inset: 16, boxShadow: glow }}
        aria-hidden
      />

      {/* Pixel art SVG */}
      <svg
        width={svgDim}
        height={svgDim}
        style={{ imageRendering: 'pixelated', position: 'relative' }}
        aria-label={`Avatar niveau ${level}`}
        role="img"
      >
        {CHAR_DESIGN.map((row, r) =>
          [...row].map((code, c) => {
            if (code === '_') return null
            const fill = palette[code]
            if (!fill) return null
            return (
              <rect
                key={`${r}-${c}`}
                x={c * pixelSize}
                y={r * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={fill}
              />
            )
          })
        )}
      </svg>
    </div>
  )
}
