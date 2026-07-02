// crypto.randomUUID() requires a secure context (HTTPS or localhost).
// Fallback when serving via LAN IP in HTTP (e.g. testing on iPhone).
export function genId(prefix = '') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${prefix || 'x'}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
