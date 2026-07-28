import { NextRequest, NextResponse } from 'next/server'
import { embedOne } from '@/lib/embeddings'
import { searchChunks } from '@/lib/qdrant'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { question, limit } = await req.json()
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'question required' }, { status: 400 })
    }

    const vector = await embedOne(question)
    const results = await searchChunks(vector, limit ?? 5)

    return NextResponse.json({ question, results })
  } catch (err) {
    console.error('[/api/query]', err)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }
}
