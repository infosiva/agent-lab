// LangGraph orchestrator: plan -> retrieve -> synthesize -> critique -> (loop or end)
import { StateGraph, Annotation, END, START } from '@langchain/langgraph'
import { trace } from '@opentelemetry/api'
import { embedOne } from './embeddings'
import { searchChunks } from './qdrant'
import { aiChat } from './ai'
import { estimateTokens, startOtel } from './otel'

const MAX_LOOPS = 2
const tracer = trace.getTracer('agent-lab/graph')

// Task-aware model tier per node (LLM/API-gateway layer, lib/ai.ts already
// implements the tiers — this just picks the right one per job):
// plan = short/cheap classification -> fast. synthesize = the answer users see -> best.
// critique = structured judgement, not creative -> balanced.
async function tracedChat(
  span: string,
  messages: Parameters<typeof aiChat>[0],
  system: string,
  maxTokens: number,
  quality: 'fast' | 'balanced' | 'best',
) {
  return tracer.startActiveSpan(span, async (otelSpan) => {
    try {
      otelSpan.setAttribute('gen_ai.request.quality_tier', quality)
      otelSpan.setAttribute('gen_ai.usage.input_tokens_estimated', estimateTokens(messages.map(m => m.content).join('\n') + system))
      const result = await aiChat(messages, system, maxTokens, quality)
      otelSpan.setAttribute('gen_ai.usage.output_tokens_estimated', estimateTokens(result))
      return result
    } finally {
      otelSpan.end()
    }
  })
}

const State = Annotation.Root({
  question: Annotation<string>,
  searchQuery: Annotation<string>,
  chunks: Annotation<{ text: string; source: string; score: number }[]>,
  answer: Annotation<string>,
  critiqueNote: Annotation<string>,
  satisfied: Annotation<boolean>,
  loops: Annotation<number>({ reducer: (a, b) => b, default: () => 0 }),
})

async function planNode(state: typeof State.State) {
  const query = await tracedChat(
    'planStep',
    [{ role: 'user', content: `Question: ${state.question}\n\nWrite ONE short search query (no explanation) to retrieve the most relevant code/docs for answering this.` }],
    'You turn questions into a single focused search query for a code/docs retrieval system. Reply with the query only, nothing else.',
    100,
    'fast',
  )
  return { searchQuery: query.trim() }
}

async function retrieveNode(state: typeof State.State) {
  return tracer.startActiveSpan('retrieve', async (span) => {
    try {
      const vector = await embedOne(state.searchQuery || state.question)
      const chunks = await searchChunks(vector, 5)
      span.setAttribute('rag.chunks_returned', chunks.length)
      return { chunks, loops: state.loops + 1 }
    } finally {
      span.end()
    }
  })
}

async function synthesizeNode(state: typeof State.State) {
  const context = state.chunks.map(c => `[${c.source}]\n${c.text}`).join('\n\n---\n\n')
  const answer = await tracedChat(
    'synthesize',
    [{ role: 'user', content: `Question: ${state.question}\n\nContext:\n${context}\n\nAnswer using ONLY facts present in the context above — do not invent library names, function names, or file contents that aren't shown. If the context doesn't fully answer the question, say what's missing. Cite source file names.` }],
    'You answer questions about a codebase strictly from the provided context. Never state a library or pattern is used unless it literally appears in the context. Be concise and cite sources.',
    700,
    'best',
  )
  return { answer }
}

async function critiqueNode(state: typeof State.State) {
  if (state.loops >= MAX_LOOPS) return { satisfied: true, critiqueNote: 'max loops reached' }

  const context = state.chunks.map(c => `[${c.source}]\n${c.text}`).join('\n\n---\n\n')
  const verdict = await tracedChat(
    'critique',
    [{ role: 'user', content: `Question: ${state.question}\n\nContext:\n${context}\n\nAnswer: ${state.answer}\n\nCheck TWO things: (1) does the answer address what was asked, (2) is every claim in the answer actually supported by the context (no invented libraries/functions/names). An answer that includes correct, context-supported details beyond the minimum is fine — do not fail it for being more complete than strictly asked. Reply with exactly one word first: YES or NO, then a short reason.` }],
    'You are a strict critic focused on factual grounding, not answer scope. Fail (NO) only when the answer states something not supported by the context — never fail an answer just for including extra correct, context-supported detail. Reply YES or NO first.',
    100,
    'balanced',
  )
  const satisfied = verdict.trim().toUpperCase().startsWith('YES')
  return { satisfied, critiqueNote: verdict }
}

function routeAfterCritique(state: typeof State.State): 'retrieve' | typeof END {
  return state.satisfied ? END : 'retrieve'
}

export function buildGraph() {
  const graph = new StateGraph(State)
    .addNode('planStep', planNode)
    .addNode('retrieve', retrieveNode)
    .addNode('synthesize', synthesizeNode)
    .addNode('critique', critiqueNode)
    .addEdge(START, 'planStep')
    .addEdge('planStep', 'retrieve')
    .addEdge('retrieve', 'synthesize')
    .addEdge('synthesize', 'critique')
    .addConditionalEdges('critique', routeAfterCritique, { retrieve: 'retrieve', [END]: END })

  return graph.compile()
}

export async function runAgent(question: string) {
  startOtel()
  const app = buildGraph()
  const result = await tracer.startActiveSpan('agent-run', async (span) => {
    span.setAttribute('agent.question', question)
    try {
      return await app.invoke({ question, loops: 0 })
    } finally {
      span.end()
    }
  })
  return {
    answer: result.answer,
    sources: [...new Set(result.chunks.map(c => c.source))],
    loops: result.loops,
    critique: result.critiqueNote,
  }
}
