import { sanitizeUserInput } from '@/lib/guard'
import { NextRequest, NextResponse } from 'next/server'
import { aiChat } from '@/lib/ai'
import { checkRateLimit, getIp } from '@/lib/rateLimit'
import { log } from '@/lib/log'

const SYSTEM = 'You are the agent-lab assistant. Explain how this RAG agent works (plan, retrieve, synthesize, critique) and how to ask it good questions about an ingested codebase. If asked anything else, reply: "I am trained for agent-lab. For that, try Google or ChatGPT!"'

// Free chain (Groq -> Gemini -> Cerebras ...) lives in lib/ai. Never 500: always 200 with a message. 60/hr per IP.
export async function POST(req: NextRequest) {
  const { ok } = checkRateLimit('chat:' + getIp(req), 60)
  if (!ok) return NextResponse.json({ text: 'Rate limit reached (60 per hour). Please try again later.' })
  try {
    const { messages } = await req.json()
    for (const m of Array.isArray(messages) ? messages : []) if (m && typeof m.content === 'string') m.content = sanitizeUserInput(m.content).text
    if (!Array.isArray(messages) || !messages.length) return NextResponse.json({ text: 'Ask me how agent-lab works.' })
    const text = await aiChat(messages.slice(-10), SYSTEM, 400, 'fast')
    log('info', 'chat_used', { turns: messages.length })
    return NextResponse.json({ text })
  } catch (e) {
    log('error', 'chat_failed', { msg: e instanceof Error ? e.message.slice(0, 120) : 'unknown' })
    return NextResponse.json({ text: 'The assistant is busy right now. Please try again in a moment.' })
  }
}
