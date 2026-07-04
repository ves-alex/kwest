// Son de fin de repos — Web Audio API.
// La vibration (navigator.vibrate) ne marche PAS sur iPhone/Safari : le son est
// le seul signal fiable sur iOS. iOS exige aussi que le contexte audio soit
// "débloqué" par un vrai geste utilisateur → appeler unlockAudio() sur un tap.

let ctx = null

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

// À appeler sur un geste utilisateur (tap) pour autoriser l'audio sur iOS.
// Une fois débloqué, il le reste pour toute la session.
export function unlockAudio() {
  const c = getCtx()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
}

// Burst de bruit blanc court, utilisé pour l'attaque de l'impact.
function makeNoiseBurst(c, duration) {
  const len = Math.floor(c.sampleRate * duration)
  const buffer = c.createBuffer(1, len, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buffer
  return src
}

// Coup de marteau sur l'enclume-gong : une frappe nette suivie d'une longue
// résonance de gong (~4 s) qui gonfle puis s'éteint, avec un miroitement
// métallique. Colle au thème "forge" — tu scelles ta série d'un coup de marteau.
export function playHammerStrike() {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})

  const now = c.currentTime
  const master = c.createGain()
  master.gain.value = 0.55 // beaucoup d'oscillateurs additionnés → on garde du headroom
  master.connect(c.destination)

  // 1) La frappe : bruit filtré très court = le contact du marteau sur le métal
  const noiseDur = 0.05
  const noise = makeNoiseBurst(c, noiseDur)
  const noiseFilter = c.createBiquadFilter()
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.value = 3000
  noiseFilter.Q.value = 0.6
  const noiseGain = c.createGain()
  noiseGain.gain.setValueAtTime(0.0001, now)
  noiseGain.gain.linearRampToValueAtTime(0.5, now + 0.002)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + noiseDur)
  noise.connect(noiseFilter).connect(noiseGain).connect(master)
  noise.start(now)
  noise.stop(now + noiseDur + 0.02)

  // 2) Le poids grave de l'impact : un "thump" bref qui plonge
  const thump = c.createOscillator()
  thump.type = 'sine'
  thump.frequency.setValueAtTime(120, now)
  thump.frequency.exponentialRampToValueAtTime(55, now + 0.2)
  const thumpGain = c.createGain()
  thumpGain.gain.setValueAtTime(0.0001, now)
  thumpGain.gain.linearRampToValueAtTime(0.5, now + 0.006)
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
  thump.connect(thumpGain).connect(master)
  thump.start(now)
  thump.stop(now + 0.45)

  // 3) La résonance de gong : partiels inharmoniques denses et graves, longue
  // traîne (les graves durent plus que les aigus). Une attaque un peu lente sur
  // les graves = le "swell" qui gonfle. Deux oscillateurs légèrement désaccordés
  // par partiel → battements = le miroitement du métal qui vibre.
  const base = 132
  const partials = [
    { ratio: 1.0, gain: 0.42, dur: 3.9, attack: 0.1 },
    { ratio: 1.52, gain: 0.3, dur: 3.3, attack: 0.08 },
    { ratio: 2.0, gain: 0.26, dur: 3.0, attack: 0.06 },
    { ratio: 2.67, gain: 0.22, dur: 2.6, attack: 0.05 },
    { ratio: 3.43, gain: 0.17, dur: 2.2, attack: 0.04 },
    { ratio: 4.35, gain: 0.13, dur: 1.8, attack: 0.03 },
    { ratio: 5.8, gain: 0.09, dur: 1.4, attack: 0.02 },
    { ratio: 7.21, gain: 0.06, dur: 1.0, attack: 0.02 },
  ]
  partials.forEach(({ ratio, gain, dur, attack }) => {
    ;[-1, 1].forEach((sign, i) => {
      const osc = c.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = base * ratio
      osc.detune.value = sign * 4 // ±4 cents → battement lent (shimmer)
      const g = c.createGain()
      const peak = gain * (i === 0 ? 1 : 0.85)
      g.gain.setValueAtTime(0.0001, now)
      g.gain.linearRampToValueAtTime(peak, now + attack)
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
      osc.connect(g).connect(master)
      osc.start(now)
      osc.stop(now + dur + 0.05)
    })
  })
}
