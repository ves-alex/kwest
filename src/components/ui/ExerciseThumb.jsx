import { useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { exerciseImage } from '../../domain/exercises'

export default function ExerciseThumb({ exerciseId, size = 48 }) {
  // Quand l'image n'existe pas encore, on bascule sur un placeholder propre.
  // On mémorise l'id en échec (plutôt qu'un booléen) pour que le fallback se
  // réinitialise tout seul quand le composant est réutilisé pour un autre exo.
  const [failedId, setFailedId] = useState(null)
  const failed = failedId === exerciseId

  if (failed) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-md border border-forge-light bg-charcoal text-ash/40"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <Dumbbell size={Math.round(size * 0.42)} strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <img
      src={exerciseImage(exerciseId)}
      alt=""
      loading="lazy"
      onError={() => setFailedId(exerciseId)}
      className="shrink-0 rounded-md border border-forge-light bg-charcoal object-cover"
      style={{
        width: size,
        height: size,
        filter: 'grayscale(1) contrast(1.6) brightness(1.05)',
      }}
    />
  )
}
