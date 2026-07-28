// ponytail: simple char-window splitter, RecursiveCharacterTextSplitter from
// langchain is available but this covers markdown/code fine without pulling
// its splitter config surface into the ingestion script.
//
// .slice() cuts UTF-16 code units, which can split a surrogate pair (emoji etc)
// and leave a lone surrogate — invalid JSON, breaks Qdrant upsert. Strip those.
function stripLoneSurrogates(s: string): string {
  return s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
}

export function chunkText(text: string, chunkSize = 1200, overlap = 150): string[] {
  if (text.length <= chunkSize) return [stripLoneSurrogates(text)]
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(stripLoneSurrogates(text.slice(start, end)))
    if (end === text.length) break
    start = end - overlap
  }
  return chunks
}
