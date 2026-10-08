import { describe, it, expect } from 'vitest'
import {
  createRestTimer,
  remainingSeconds,
  startRestTimer,
  pauseRestTimer,
  finishRestTimer,
  adjustRestTimer,
} from './restTimer'

const T0 = 1_800_000_000_000 // un instant quelconque, en ms

describe('minuteur de repos', () => {
  it('démarré : le temps restant suit l’horloge, même après un gel de la page', () => {
    const t = createRestTimer(90, { start: true, now: T0 })
    expect(remainingSeconds(t, T0)).toBe(90)
    expect(remainingSeconds(t, T0 + 2_000)).toBe(88)
    // Écran verrouillé 30 s : aucun tic pendant ce temps, mais au retour le
    // compte est juste (avant : 1:28 → 1:26 au lieu de 0:58)
    expect(remainingSeconds(t, T0 + 32_000)).toBe(58)
  })

  it('fini pendant l’absence : 0, jamais négatif', () => {
    const t = createRestTimer(60, { start: true, now: T0 })
    expect(remainingSeconds(t, T0 + 60_000)).toBe(0)
    expect(remainingSeconds(t, T0 + 10 * 60_000)).toBe(0)
  })

  it('prêt sans démarrer : ne bouge pas', () => {
    const t = createRestTimer(120, { now: T0 })
    expect(t.endsAt).toBeNull()
    expect(remainingSeconds(t, T0 + 50_000)).toBe(120)
  })

  it('pause puis reprise : le temps de pause n’est pas décompté', () => {
    const t = createRestTimer(90, { start: true, now: T0 })
    const paused = pauseRestTimer(t, T0 + 30_000)
    expect(remainingSeconds(paused, T0 + 100_000)).toBe(60)
    const resumed = startRestTimer(paused, T0 + 100_000)
    expect(remainingSeconds(resumed, T0 + 110_000)).toBe(50)
  })

  it('±15 s : sur la durée et le restant, en marche comme à l’arrêt, jamais sous 5 s', () => {
    const running = createRestTimer(90, { start: true, now: T0 })
    const plus = adjustRestTimer(running, 15, T0 + 10_000)
    expect(plus.duration).toBe(105)
    expect(remainingSeconds(plus, T0 + 10_000)).toBe(95)

    const ready = createRestTimer(10, { now: T0 })
    const minus = adjustRestTimer(ready, -15, T0)
    expect(minus.duration).toBe(5)
    expect(remainingSeconds(minus, T0)).toBe(5)
  })

  it('terminé : arrêté à 0', () => {
    const done = finishRestTimer(createRestTimer(60, { start: true, now: T0 }))
    expect(done.endsAt).toBeNull()
    expect(remainingSeconds(done, T0 + 5_000)).toBe(0)
  })
})
