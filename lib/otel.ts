// Observability layer (Full Stack of Agentic AI — "Observability & Evaluation").
// OTel spans per graph node -> Langfuse via OTLP. No-op if LANGFUSE_* env vars absent
// (never block local dev on a third-party account).
import { NodeSDK } from '@opentelemetry/sdk-node'
import { LangfuseSpanProcessor } from '@langfuse/otel'

let started = false

export function startOtel() {
  if (started) return
  started = true

  const publicKey = process.env.LANGFUSE_PUBLIC_KEY
  const secretKey = process.env.LANGFUSE_SECRET_KEY
  if (!publicKey || !secretKey) {
    console.warn('[otel] LANGFUSE_PUBLIC_KEY/SECRET_KEY missing — tracing disabled')
    return
  }

  const sdk = new NodeSDK({
    spanProcessors: [
      new LangfuseSpanProcessor({
        publicKey,
        secretKey,
        baseUrl: process.env.LANGFUSE_HOST ?? 'https://cloud.langfuse.com',
      }),
    ],
  })
  sdk.start()
}

// ponytail: char/4 token estimate — no real tokenizer wired (providers don't return
// usage through aiChat's string-only return). Upgrade to tiktoken if cost tracking
// needs to be exact rather than directional.
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
