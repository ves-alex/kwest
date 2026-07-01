// data: [{ date: '1 juil.', maxWeight: 80 }, ...]
export default function ProgressChart({ data }) {
  if (!data || data.length < 2) return null

  const weights = data.map((d) => d.maxWeight)
  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const allSame = minW === maxW

  const W = 300
  const H = 80
  const PX = 6
  const PY = 12

  const iW = W - PX * 2
  const iH = H - PY * 2

  const getY = (w) =>
    allSame ? PY + iH / 2 : PY + iH - ((w - minW) / (maxW - minW)) * iH

  const pts = data.map((d, i) => ({
    x: PX + (i / (data.length - 1)) * iW,
    y: getY(d.maxWeight),
    ...d,
  }))

  const linePath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`

  const EMBER = '#c2410c'

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ display: 'block' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="chart-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={EMBER} stopOpacity="0.22" />
            <stop offset="100%" stopColor={EMBER} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#chart-area-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke={EMBER}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3" fill={EMBER} />
        ))}
        {!allSame && (
          <>
            <text x={PX} y={PY - 3} fontSize="7" fill="#71717a" textAnchor="start">
              {maxW}kg
            </text>
            <text x={PX} y={H} fontSize="7" fill="#71717a" textAnchor="start">
              {minW}kg
            </text>
          </>
        )}
      </svg>
      <div className="mt-1 flex justify-between px-1">
        <span className="text-[9px] text-ash/50">{data[0].date}</span>
        <span className="text-[9px] text-ash/50">{data[data.length - 1].date}</span>
      </div>
    </div>
  )
}
