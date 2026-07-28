// promptfoo provider for the planStep prompt (lib/graph.ts planNode) — 'fast' tier.
import { config } from 'dotenv'; config({ path: '../.env.local' })
import { aiChat } from '../lib/ai.ts'

export default class PlanProvider {
  id() { return 'planStep' }
  async callApi(prompt, context) {
    const { question } = context.vars
    const query = await aiChat(
      [{ role: 'user', content: `Question: ${question}\n\nWrite ONE short search query (no explanation) to retrieve the most relevant code/docs for answering this.` }],
      'You turn questions into a single focused search query for a code/docs retrieval system. Reply with the query only, nothing else.',
      100,
      'fast',
    )
    return { output: query.trim() }
  }
}
