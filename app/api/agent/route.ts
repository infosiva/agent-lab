import { NextRequest, NextResponse } from 'next/server'
import { runAgent } from '@/lib/graph'
import { checkRateLimit, getIp } from '@/lib/rateLimit'
import { log } from '@/lib/log'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { ok, remaining } = checkRateLimit(getIp(req), 20)
  if (!ok) {
    return NextResponse.json({ error: 'Rate limit exceeded — 20 requests/hour' }, { status: 429 })
  }

  try {
    const { question } = await req.json()
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'question required' }, { status: 400 })
    }

    const result = await runAgent(question)
    return NextResponse.json({ ...result, remaining })
  } catch (err) {
    log('error', 'agent_failed', { msg: err instanceof Error ? err.message.slice(0, 120) : 'unknown' })
    return NextResponse.json({ error: 'The agent could not answer right now. Please try again in a moment.' }, { status: 200 })
  }
}
