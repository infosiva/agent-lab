'use client'
import { useState } from 'react'

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState(false)
  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!msg.trim()) return
    try { await fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'general', message: msg, page: location.pathname }) }) } catch {}
    setDone(true); setMsg('')
    setTimeout(() => { setOpen(false); setDone(false) }, 1500)
  }
  return (
    <div className="fixed bottom-4 left-4 z-50">
      {open ? (
        <form onSubmit={send} className="w-72 rounded-xl border border-(--line) bg-(--surface-strong) p-3 shadow-xl backdrop-blur">
          {done ? <p className="text-sm text-(--ink)">Thanks, noted.</p> : (
            <>
              <label htmlFor="fb" className="mb-1 block text-xs text-(--ink-2)">What should we improve?</label>
              <textarea id="fb" value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={500} rows={3} className="w-full rounded-lg border border-(--line) bg-transparent p-2 text-sm text-(--ink) outline-none focus:border-(--accent)" />
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="min-h-11 px-3 text-sm text-(--ink-2)">Cancel</button>
                <button type="submit" className="btn-press min-h-11 rounded-lg bg-(--accent) px-4 text-sm font-semibold text-(--on-accent)">Send</button>
              </div>
            </>
          )}
        </form>
      ) : (
        <button onClick={() => setOpen(true)} className="btn-press min-h-11 rounded-full border border-(--line) bg-(--surface-strong) px-4 text-sm text-(--ink) backdrop-blur">Feedback</button>
      )}
    </div>
  )
}
