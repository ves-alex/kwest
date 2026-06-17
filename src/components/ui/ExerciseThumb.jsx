import { exerciseImage } from '../../domain/exercises'

export default function ExerciseThumb({ exerciseId, size = 48 }) {
  return (
    <img
      src={exerciseImage(exerciseId)}
      alt=""
      loading="lazy"
      className="shrink-0 rounded-md border border-forge-light bg-charcoal object-cover"
      style={{
        width: size,
        height: size,
        filter: 'grayscale(1) contrast(1.6) brightness(1.05)',
      }}
    />
  )
}
