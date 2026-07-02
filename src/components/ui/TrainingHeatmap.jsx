const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function getMonday(d) {
  const day = d.getDay()
  const m = new Date(d)
  m.setDate(m.getDate() - day + (day === 0 ? -6 : 1))
  m.setHours(0, 0, 0, 0)
  return m
}

// Heatmap de type "GitHub contributions" — colonnes = semaines, lignes = jours (lun→dim).
// trainedSet : Set de "YYYY-MM-DD" pour les jours actifs.
export default function TrainingHeatmap({ trainedSet, numWeeks = 12, onDayClick, selectedDay }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startMonday = new Date(getMonday(today))
  startMonday.setDate(startMonday.getDate() - (numWeeks - 1) * 7)

  const weeks = Array.from({ length: numWeeks }, (_, wi) =>
    Array.from({ length: 7 }, (_, di) => {
      const d = new Date(startMonday)
      d.setDate(d.getDate() + wi * 7 + di)
      return d
    })
  )

  // Labels de mois : 1 fois par mois, au début de la colonne du mois
  const monthLabels = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const m = week[0].getMonth()
    if (m !== lastMonth) {
      monthLabels.push({
        wi,
        label: week[0].toLocaleDateString('fr-FR', { month: 'short' }),
      })
      lastMonth = m
    }
  })

  const CELL = 12
  const GAP = 3
  const STEP = CELL + GAP

  return (
    <div>
      <div className="relative mb-1 ml-5 h-3">
        {monthLabels.map(({ wi, label }) => (
          <span
            key={wi}
            className="absolute text-[8px] text-ash/50"
            style={{ left: wi * STEP }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex items-start gap-1">
        <div className="flex flex-col" style={{ gap: GAP }}>
          {DAY_LABELS.map((d, i) => (
            <div
              key={i}
              style={{ height: CELL, width: 12 }}
              className="flex items-center text-[8px] text-ash/40"
            >
              {i % 2 === 0 ? d : ''}
            </div>
          ))}
        </div>

        <div className="flex" style={{ gap: GAP }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
              {week.map((day, di) => {
                const key = day.toISOString().slice(0, 10)
                const isFuture = day > today
                const trained = trainedSet.has(key)
                const isSelected = selectedDay === key
                return (
                  <div
                    key={di}
                    style={{ width: CELL, height: CELL, borderRadius: 2 }}
                    className={[
                      isFuture ? 'bg-charcoal/20' : trained ? 'bg-ember' : 'bg-charcoal',
                      trained && onDayClick ? 'cursor-pointer active:opacity-70' : '',
                      isSelected ? 'ring-1 ring-cream ring-offset-1 ring-offset-forge' : '',
                    ].join(' ')}
                    onClick={() => trained && onDayClick?.(key)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1.5">
        <span className="text-[8px] text-ash/40">repos</span>
        <div style={{ width: CELL, height: CELL, borderRadius: 2 }} className="bg-charcoal" />
        <div style={{ width: CELL, height: CELL, borderRadius: 2 }} className="bg-ember" />
        <span className="text-[8px] text-ash/40">séance</span>
      </div>
    </div>
  )
}
