import { Flame, Dumbbell, Hammer, ScrollText } from 'lucide-react'

export const TABS = [
  { id: 'home', label: 'Refuge', Icon: Flame, path: '/' },
  { id: 'session', label: 'Séance', Icon: Dumbbell, path: '/session' },
  { id: 'shop', label: 'Atelier', Icon: Hammer, path: '/shop' },
  { id: 'stats', label: 'Chroniques', Icon: ScrollText, path: '/stats' },
]
