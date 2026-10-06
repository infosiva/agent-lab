import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/log'

// Structured log + optional Telegram (only if both env vars are set). No auth: any visitor may submit.
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const rec = {
      type: String(b.type ?? b.vote ?? '').slice(0, 30),
      rating: typeof b.rating === 'number' ? b.rating : undefined,
      message: String(b.message ?? b.text ?? '').slice(0, 500),
      page: String(b.page ?? '').slice(0, 120),
      site: 'agent-lab',
    }
    log('info', 'feedback_sent', rec)
    const tok = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID
    if (tok && chat) {
      fetch(`https://api.telegram.org/bot${tok}/sendMessage`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text: `agent-lab feedback [${rec.type}] ${rec.message}`.slice(0, 900) }),
      }).catch(() => {})
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
