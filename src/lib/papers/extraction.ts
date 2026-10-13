import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { MAX_PAGES, MAX_TEXT_CHARS, validatePdf } from './ingestion';
import { PaperError } from './errors';
import type { Extraction, Passage, ExtractedItem } from './schemas';
const heading = /^(?:\d+(?:\.\d+)*\.?\s+[A-Z][\w ,:–—()/-]{2,100}|abstract|references|bibliography|introduction|conclusion(?:s)?|discussion|methods|methodology|results|limitations|acknowledg(?:e)?ments|appendix(?:\s+[A-Z])?)$/i;
function splitText(text: string) {
  const chunks: string[] = []; let remaining = text;
  while (remaining.length > 1600) { let end = remaining.lastIndexOf('\n', 1600); if (end < 600) end = remaining.lastIndexOf(' ', 1600); if (end < 600) end = 1600; chunks.push(remaining.slice(0, end)); remaining = remaining.slice(end).trimStart(); }
  if (remaining.trim()) chunks.push(remaining.trim()); return chunks;
}
export function structurePages(pages: Extraction['pages'], title: string, authors: string[] = []): Extraction {
  const passages: Passage[] = []; const sections: Extraction['sections'] = [];
  let section = 'Front matter';
  for (const page of pages) {
    let buffer = '';
    const flush = () => { for (const text of splitText(buffer.trim())) passages.push({ id: `p${page.page}-${passages.filter(p=>p.page===page.page).length+1}`, page: page.page, section, text }); buffer = ''; };
    for (const line of page.text.split('\n')) {
      if ((page.headings ? page.headings.includes(line.trim()) : heading.test(line.trim())) && line.trim().length < 110) { flush(); section = line.trim(); sections.push({ title: section, page: page.page, passageIds: [] }); }
      buffer += line + '\n';
    }
    flush();
  }
  for (const s of sections) s.passageIds = passages.filter(p => p.section === s.title && p.page >= s.page).map(p => p.id);
  const abstractParts = passages.filter(p => /^abstract$/i.test(p.section));
  const abstract = abstractParts.map(p => p.text.replace(/^abstract\s*/i, '')).join('\n');
  const equations: ExtractedItem[] = [], figures: ExtractedItem[] = [], references: ExtractedItem[] = [];
  for (const p of passages) {
    const lines = p.text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^(?:figure|fig\.)\s*\d+[.:\s]/i.test(line)) figures.push({ text: lines.slice(i, Math.min(i+4,lines.length)).join('\n'), page: p.page, passageIds: [p.id] });
      if ((/[=∑∫≈≡]/.test(line) && /\(\d+[a-z]?\)\s*$/.test(line)) || /^\(\d+[a-z]?\)$/.test(line)) equations.push({ text: lines.slice(Math.max(0,i-2),i+1).join('\n'), page: p.page, passageIds: [p.id] });
    }
    if (/references|bibliography/i.test(p.section)) references.push({ text: p.text, page: p.page, passageIds: [p.id] });
  }
  const warnings = ['PDF text extraction is approximate: columns, mathematical symbols, and reading order may be imperfect.', 'Equations are text candidates. Figures link to original page previews, not cropped images. OCR, LaTeX reconstruction, and AI interpretation of figure images are not included.'];
  if (!abstract) warnings.push('No separate abstract heading was detected; consult the first-page passages.');
  if (!sections.length) warnings.push('Section headings could not be identified reliably.');
  if (pages.some(p=>p.text.trim().length<30)) warnings.push('Some pages contain little extractable text; image-only content is unavailable.');
  return { title, authors, abstract, pageCount: pages.length, pages, passages, sections, equations, figures, references, warnings };
}
export async function extractPdf(bytes: Uint8Array, filename: string): Promise<Extraction> {
  validatePdf(bytes, filename);
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(path.join(process.cwd(),'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
  const task = pdfjs.getDocument({ data: Uint8Array.from(bytes), useSystemFonts: true });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > MAX_PAGES) throw new PaperError(`Please use a PDF with at most ${MAX_PAGES} pages.`, 413);
    const pages: Extraction['pages'] = []; let total = 0;
    const titleLines: { text: string; size: number }[] = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n); const content = await page.getTextContent();
      let text = '', line = '', lastY: number | null = null, lineSize = 0;
      const lineInfo:{text:string;size:number}[]=[];
      const flush = () => { if (line.trim()) { text += line.trim() + '\n'; const info={text:line.trim(),size:lineSize};lineInfo.push(info);if(n===1) titleLines.push(info); } line='';lineSize=0; };
      for (const item of content.items) {
        if (!('str' in item)) continue;
        const y = item.transform[5];
        if (lastY !== null && Math.abs(y-lastY)>3) flush();
        line += item.str + ' '; lineSize = Math.max(lineSize,Math.abs(item.transform[3])); lastY=y;
        if (item.hasEOL) flush();
      }
      flush(); total += text.length;
      if (total > MAX_TEXT_CHARS) throw new PaperError('This paper has too much text for this prototype. Use a shorter paper; no content has been silently truncated.', 413);
      const bodySizes=lineInfo.filter(l=>l.text.length>45).map(l=>l.size).sort((a,b)=>a-b);
      const bodySize=bodySizes[Math.floor(bodySizes.length/2)]||12;
      const headings=lineInfo.filter(l=>heading.test(l.text) && (l.size>bodySize*1.06 || /^(?:abstract|references|bibliography|introduction|conclusions?|discussion|methods|methodology|results|limitations|acknowledg(?:e)?ments|appendix(?:\s+[A-Z])?|\d+(?:\.\d+)*\.?\s+(?:introduction|methods|methodology|results|limitations|discussion|conclusions?))$/i.test(l.text))).map(l=>l.text);
      pages.push({page:n,text:text.trim(),headings}); page.cleanup();
    }
    if (total < 250) throw new PaperError('This PDF has too little readable text. Scanned PDFs need OCR, which is not supported yet.');
    const metadata = await pdf.getMetadata(); const info = metadata.info as { Title?: string; Author?: string };
    const largest = Math.max(...titleLines.slice(0,30).filter(l=>l.text.length>8).map(l=>l.size));
    const titleStart=titleLines.slice(0,30).findIndex(l=>l.size>=largest*.92 && l.text.length>8 && !/^arxiv:/i.test(l.text));
    const titleParts:string[]=[];
    if(titleStart>=0)for(const l of titleLines.slice(titleStart,titleStart+5)){if(l.size<largest*.92 || l.text.length<=8 || heading.test(l.text) || titleParts.join(' ').length>220)break;titleParts.push(l.text);}
    const guessed=titleParts.join(' ');
    const title = info.Title?.trim() && !/^(?:untitled|microsoft|latex)/i.test(info.Title) ? info.Title : guessed || filename.replace(/\.pdf$/i,'');
    const extraction=structurePages(pages, title, info.Author ? [info.Author] : []);
    if(!info.Title?.trim())extraction.warnings.push('Title inferred from first-page typography; check it against the original.');
    return extraction;
  } catch(error) {
    if (error instanceof PaperError) throw error;
    console.error('PDF extraction failed:', error instanceof Error ? error.message : 'Unknown parser error');
    throw new PaperError('Could not read this PDF. It may be damaged or password-protected.');
  } finally { await task.destroy(); }
}
export async function renderPdfPage(bytes:Uint8Array,pageNumber:number){
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
  const {createCanvas}=await import('@napi-rs/canvas');
  pdfjs.GlobalWorkerOptions.workerSrc=pathToFileURL(path.join(process.cwd(),'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
  const task=pdfjs.getDocument({data:Uint8Array.from(bytes),useSystemFonts:true});
  try{const pdf=await task.promise;if(!Number.isInteger(pageNumber)||pageNumber<1||pageNumber>pdf.numPages)throw new PaperError('Page not found.',404);
    const page=await pdf.getPage(pageNumber),base=page.getViewport({scale:1});
    const viewport=page.getViewport({scale:Math.min(1.5,1000/base.width,1400/base.height)});
    const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
    await page.render({canvas:canvas as unknown as HTMLCanvasElement,canvasContext:canvas.getContext('2d') as unknown as CanvasRenderingContext2D,viewport}).promise;
    return canvas.toBuffer('image/png');
  }finally{await task.destroy();}
}
