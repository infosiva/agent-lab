// Single embedder for both ingestion and query: NVIDIA NIM nv-embedqa-e5-v5.
// Same provider everywhere — no local/cloud split, no dimension mismatch between
// ingestion-time and query-time vectors. 1024-dim, matches lib/qdrant.ts EMBEDDING_DIM.

const NVIDIA_EMBED_MODEL = 'nvidia/nv-embedqa-e5-v5'

async function embedNvidia(text: string, inputType: 'query' | 'passage'): Promise<number[]> {
  const key = process.env.NVIDIA_API_KEY
  if (!key) throw new Error('NVIDIA_API_KEY missing')
  const res = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ input: [text], model: NVIDIA_EMBED_MODEL, input_type: inputType }),
  })
  if (!res.ok) throw new Error(`NVIDIA embed failed: ${res.status}`)
  const data = await res.json()
  return data.data[0].embedding
}

/** Ingestion path — embeds document chunks. */
export async function embedLocal(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(t => embedNvidia(t, 'passage')))
}

/** Query path — embeds the user's search query. */
export async function embedOne(text: string): Promise<number[]> {
  return embedNvidia(text, 'query')
}
