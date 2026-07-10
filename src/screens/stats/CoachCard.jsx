import { useState } from 'react'
import { Hammer, Loader2, Send } from 'lucide-react'
import { askCoach } from '../../lib/coach'
import RichText from '../../components/ui/RichText'

// Message initial (caché) qui amorce le bilan. Le premier message d'une
// conversation Claude doit être un message « user ».
const BILAN_PROMPT = "Fais-moi un bilan de mes dernières semaines d'entraînement."

export default function CoachCard() {
  const [messages, setMessages] = useState([]) // historique API ; [0] = amorce cachée
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [input, setInput] = useState('')

  const started = messages.length > 0
  const visible = messages.slice(1) // on masque l'amorce du bilan

  const runConsult = async () => {
    const init = [{ role: 'user', content: BILAN_PROMPT }]
    setMessages(init)
    setLoading(true)
    setError('')
    try {
      const reponse = await askCoach(init)
      setMessages([...init, { role: 'assistant', content: reponse }])
    } catch (e) {
      setError(e.message)
      setMessages([]) // on réaffiche le bouton pour réessayer
    } finally {
      setLoading(false)
    }
  }

  const sendQuestion = async () => {
    const q = input.trim()
    if (!q || loading) return
    const next = [...messages, { role: 'user', content: q }]
    setMessages(next)
    setInput('')
    setLoading(true)
    setError('')
    try {
      const reponse = await askCoach(next)
      setMessages([...next, { role: 'assistant', content: reponse }])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-ember/40 bg-forge p-5">
      <div className="flex items-center gap-2.5">
        <Hammer size={16} className="text-ember" />
        <p className="font-display text-sm uppercase tracking-[0.2em] text-cream">Le Forgeron</p>
      </div>
      <p className="mt-1.5 text-[11px] text-ash">
        Un regard sur tes dernières semaines de travail à l'enclume.
      </p>

      {!started && !loading && (
        <button
          type="button"
          onClick={runConsult}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-md border border-ember bg-forge px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-cream transition-colors hover:bg-ember/20"
        >
          Consulter le Forgeron
        </button>
      )}

      {started && (
        <div className="mt-4 space-y-3">
          {visible.map((m, i) =>
            m.role === 'assistant' ? (
              <div key={i} className="border-l-2 border-ember/50 pl-3">
                <RichText text={m.content} className="text-[13px] leading-relaxed text-cream/90" />
              </div>
            ) : (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm border border-forge-light bg-charcoal px-3 py-2 text-[13px] text-cream/90">
                  {m.content}
                </p>
              </div>
            ),
          )}

          {loading && (
            <div className="flex items-center gap-2 text-[12px] text-ash">
              <Loader2 size={14} className="animate-spin" />
              {visible.length === 0 ? 'Le Forgeron examine ton travail…' : 'Le Forgeron réfléchit…'}
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-[12px] text-ash">{error}</p>}

      {started && (
        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendQuestion()
            }}
            placeholder="Pose ta question au Forgeron…"
            disabled={loading}
            className="flex-1 rounded-md border border-forge-light bg-charcoal px-3 py-2 text-[13px] text-cream placeholder:text-ash/50 focus:border-ember focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={sendQuestion}
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ember bg-forge text-ember transition-colors hover:bg-ember/20 disabled:opacity-40"
            aria-label="Envoyer la question"
          >
            <Send size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
