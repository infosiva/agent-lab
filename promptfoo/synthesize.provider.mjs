// promptfoo provider for the synthesize prompt (lib/graph.ts synthesizeNode) — 'best' tier.
import { config } from 'dotenv'; config({ path: '../.env.local' })
import { aiChat } from '../lib/ai.ts'

export default class SynthesizeProvider {
  id() { return 'synthesize' }
  async callApi(prompt, context) {
    const { question, contextText } = context.vars
    const answer = await aiChat(
      [{ role: 'user', content: `Question: ${question}\n\nContext:\n${contextText}\n\nAnswer using ONLY facts present in the context above — do not invent library names, function names, or file contents that aren't shown. If the context doesn't fully answer the question, say what's missing. Cite source file names.` }],
      'You answer questions about a codebase strictly from the provided context. Never state a library or pattern is used unless it literally appears in the context. Be concise and cite sources.',
      700,
      'best',
    )
    return { output: answer }
  }
}
