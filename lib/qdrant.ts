import { QdrantClient } from '@qdrant/js-client-rest'

export const COLLECTION = 'agent_lab_docs'
export const EMBEDDING_DIM = 1024 // nvidia/nv-embedqa-e5-v5 (NVIDIA NIM, cloud, works locally + Vercel)

let _client: QdrantClient | null = null

export function getQdrant(): QdrantClient {
  if (!process.env.QDRANT_URL) throw new Error('QDRANT_URL missing')
  if (!_client) {
    _client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    })
  }
  return _client
}

export async function ensureCollection() {
  const client = getQdrant()
  const collections = await client.getCollections()
  const exists = collections.collections.some(c => c.name === COLLECTION)
  if (!exists) {
    await client.createCollection(COLLECTION, {
      vectors: { size: EMBEDDING_DIM, distance: 'Cosine' },
    })
  }
}

export interface DocChunk {
  id: string
  text: string
  source: string
  chunkIndex: number
}

export async function upsertChunks(chunks: DocChunk[], vectors: number[][]) {
  const client = getQdrant()
  await client.upsert(COLLECTION, {
    points: chunks.map((chunk, i) => ({
      id: chunk.id,
      vector: vectors[i],
      payload: { text: chunk.text, source: chunk.source, chunkIndex: chunk.chunkIndex },
    })),
  })
}

export async function searchChunks(vector: number[], limit = 5) {
  const client = getQdrant()
  const { points } = await client.query(COLLECTION, { query: vector, limit, with_payload: true })
  return points.map(r => ({
    text: r.payload?.text as string,
    source: r.payload?.source as string,
    score: r.score,
  }))
}
