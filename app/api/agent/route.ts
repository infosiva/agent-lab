import { NextRequest, NextResponse } from 'next/server'
import { runAgent } from '@/lib/graph'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json()
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'question required' }, { status: 400 })
    }

    const result = await runAgent(question)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/agent]', err)
    return NextResponse.json({ error: 'Agent run failed' }, { status: 500 })
  }
}
