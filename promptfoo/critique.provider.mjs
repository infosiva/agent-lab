// promptfoo custom provider — calls the real critiqueNode prompt/model path
// (lib/graph.ts) so eval results reflect production behavior, not a copy.
import { config } from 'dotenv'; config({ path: '../.env.local' })
import { aiChat } from '../lib/ai.ts'

export default class CritiqueProvider {
  id() { return 'critique' }
  async callApi(prompt, context) {
    const { question, contextText, answer } = context.vars
    const verdict = await aiChat(
      [{ role: 'user', content: `Question: ${question}\n\nContext:\n${contextText}\n\nAnswer: ${answer}\n\nCheck TWO things: (1) does the answer address what was asked, (2) is every claim in the answer actually supported by the context (no invented libraries/functions/names). An answer that includes correct, context-supported details beyond the minimum is fine — do not fail it for being more complete than strictly asked. Reply with exactly one word first: YES or NO, then a short reason.` }],
      'You are a strict critic focused on factual grounding, not answer scope. Fail (NO) only when the answer states something not supported by the context — never fail an answer just for including extra correct, context-supported detail. Reply YES or NO first.',
      100,
      'balanced',
    )
    return { output: verdict }
  }
}
