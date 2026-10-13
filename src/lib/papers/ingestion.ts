import { PaperError } from './errors';
export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_PAGES = 100;
export const MAX_TEXT_CHARS = 220_000;
export function validatePdf(bytes: Uint8Array, filename: string) {
  if (bytes.length > MAX_PDF_BYTES) throw new PaperError('PDFs must be 20 MB or smaller.', 413);
  if (!filename.toLowerCase().endsWith('.pdf') || bytes.length < 8 || Buffer.from(bytes.slice(0, 5)).toString() !== '%PDF-') throw new PaperError('Please upload a valid PDF file.');
}
export function parseArxivUrl(input: string) {
  let url: URL;
  try { url = new URL(input); } catch { throw new PaperError('Enter an arXiv abstract or PDF URL.'); }
  if (url.protocol !== 'https:' || !['arxiv.org', 'www.arxiv.org'].includes(url.hostname) || url.port || url.username || url.password || url.search || url.hash) throw new PaperError('Use an https://arxiv.org/abs/... or /pdf/... URL.');
  const match = /^\/(?:abs|pdf)\/((?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v[1-9]\d*)?)(?:\.pdf)?$/.exec(url.pathname);
  if (!match) throw new PaperError('That URL does not contain a valid arXiv paper identifier.');
  return { id: match[1], url: `https://arxiv.org/abs/${match[1]}`, pdfUrl: `https://arxiv.org/pdf/${match[1]}` };
}
export async function readLimited(response: Response, limit: number): Promise<Uint8Array> {
  if (Number(response.headers.get('content-length')) > limit) throw new PaperError('The document exceeds the size limit.', 413);
  if (!response.body) throw new PaperError('The document was empty.');
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let total = 0;
  try { while (true) { const { value, done } = await reader.read(); if (done) break; total += value.length; if (total > limit) throw new PaperError('The document exceeds the size limit.', 413); chunks.push(value); } }
  finally { await reader.cancel().catch(() => {}); }
  return Buffer.concat(chunks);
}
export async function downloadArxiv(input: string) {
  const source = parseArxivUrl(input);
  try {
    // Construct from a validated identifier; never fetch a user-controlled host or follow redirects.
    const response = await fetch(source.pdfUrl, { redirect: 'error', signal: AbortSignal.timeout(45_000), headers: { 'User-Agent': 'PaperMotion/0.2 (local research reader)' } });
    if (!response.ok) throw new PaperError(response.status === 404 ? 'This arXiv paper was not found.' : 'arXiv could not serve this paper. Try again or upload its PDF.', 502);
    const bytes = await readLimited(response, MAX_PDF_BYTES);
    const filename = `${source.id.replace('/', '-')}.pdf`;
    validatePdf(bytes, filename);
    return { bytes, filename, source: { kind: 'arxiv' as const, url: source.url, arxivId: source.id } };
  } catch (error) { if (error instanceof PaperError) throw error; throw new PaperError('Could not download from arXiv. Try again or upload the PDF.', 502); }
}
