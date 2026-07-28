import { NextRequest, NextResponse } from 'next/server'
import { runAgent } from '@/lib/graph'
import { checkRateLimit, getIp } from '@/lib/rateLimit'

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
    console.error('[/api/agent]', err)
    return NextResponse.json({ error: 'Agent run failed' }, { status: 500 })
  }
}
