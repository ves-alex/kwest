import { useState, useEffect } from 'react'

// Anime un compteur de 0 à `to` avec ease-out exponentiel.
// Rendu inline : retourne juste le nombre courant.
export default function CountUp({ to, delay = 0, duration = 1.2 }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!to) return
    const timer = setTimeout(() => {
      const start = performance.now()
      const tick = (now) => {
        const t = Math.min((now - start) / (duration * 1000), 1)
        setValue(Math.round((1 - Math.pow(2, -10 * t)) * to))
        if (t < 1) requestAnimationFrame(tick)
        else setValue(to)
      }
      requestAnimationFrame(tick)
    }, delay * 1000)
    return () => clearTimeout(timer)
  }, [to, delay, duration])
  return value
}
