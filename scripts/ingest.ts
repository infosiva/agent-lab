// Ingestion: walk a target repo, chunk text files, embed via NVIDIA NIM, upsert to Qdrant.
// Run: npx tsx scripts/ingest.ts [path-to-repo]
// Requires: NVIDIA_API_KEY, QDRANT_URL/QDRANT_API_KEY in .env.local

import { config } from 'dotenv'
config({ path: '.env.local' })
import { readdirSync, statSync, readFileSync } from 'fs'
import { join, relative, extname } from 'path'
import { createHash } from 'crypto'
import { chunkText } from '../lib/chunk'
import { embedLocal } from '../lib/embeddings'
import { ensureCollection, upsertChunks, type DocChunk } from '../lib/qdrant'

const INCLUDE_EXT = new Set(['.md', '.mdx', '.ts', '.tsx', '.js', '.jsx', '.txt', '.json'])
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', '.vercel',
  '.turbo', 'coverage', '.serena', 'awesome-llm-apps',
])
const MAX_FILE_BYTES = 200_000 // skip huge generated files (lockfiles etc)
const BATCH_SIZE = 20 // embed/upsert in batches — avoid hammering local Ollama

// Phase 7 (agents/ monorepo): 10,591 files matched INCLUDE_EXT across ~100+ portfolio
// project dirs — mostly per-project app code, not useful for "how does this repo's
// shared tooling/standards work" queries. ONLY_MD_DIRS restricts a dir to *.md only
// (design-system/ vendors a whole nested repo+node_modules under its code files).
const ONLY_MD_DIRS = new Set(['design-system'])

function walk(dir: string, root: string, out: string[] = []): string[] {
  const relDir = relative(root, dir)
  const topLevel = relDir.split('/')[0]
  const mdOnly = ONLY_MD_DIRS.has(topLevel)
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walk(full, root, out)
    } else {
      const ext = extname(entry)
      const included = mdOnly ? ext === '.md' : INCLUDE_EXT.has(ext)
      if (included && stat.size <= MAX_FILE_BYTES) out.push(full)
    }
  }
  return out
}

function idFor(source: string, chunkIndex: number): string {
  return createHash('md5').update(`${source}::${chunkIndex}`).digest('hex')
}

async function main() {
  const targets = process.argv.slice(2)
  if (!targets.length) targets.push(process.cwd())
  const root = process.env.INGEST_ROOT ? join(process.cwd(), process.env.INGEST_ROOT) : process.cwd()
  console.log(`[ingest] walking ${targets.length} target(s)`)

  const files: string[] = []
  for (const t of targets) {
    const full = join(root, t)
    const stat = statSync(full)
    if (stat.isDirectory()) walk(full, root, files)
    else if (INCLUDE_EXT.has(extname(full)) && stat.size <= MAX_FILE_BYTES) files.push(full)
  }
  console.log(`[ingest] found ${files.length} files`)

  await ensureCollection()

  let totalChunks = 0
  let pending: DocChunk[] = []

  async function flush() {
    if (!pending.length) return
    const vectors = await embedLocal(pending.map(c => c.text))
    await upsertChunks(pending, vectors)
    totalChunks += pending.length
    console.log(`[ingest] upserted ${totalChunks} chunks so far`)
    pending = []
  }

  for (const file of files) {
    const source = relative(root, file)
    let text: string
    try {
      text = readFileSync(file, 'utf-8')
    } catch {
      continue
    }
    if (!text.trim()) continue

    const chunks = chunkText(text)
    for (let i = 0; i < chunks.length; i++) {
      pending.push({ id: idFor(source, i), text: chunks[i], source, chunkIndex: i })
      if (pending.length >= BATCH_SIZE) await flush()
    }
  }
  await flush()

  console.log(`[ingest] done — ${totalChunks} chunks from ${files.length} files`)
}

main().catch(err => {
  console.error('[ingest] failed', err)
  process.exit(1)
})
