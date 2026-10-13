import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, writeFile, open, unlink } from 'node:fs/promises';
import path from 'node:path';
import { PaperError } from './errors';
import type { PaperRecord, PaperSummary } from './schemas';
export const dataDirectory = () => path.resolve(/*turbopackIgnore: true*/ process.env.PAPERMOTION_DATA_DIR || path.join(process.cwd(),'.papermotion'));
export function paperId(bytes: Uint8Array) { return createHash('sha256').update(bytes).digest('hex'); }
function filePath(id: string, ext='json') { if (!/^[a-f0-9]{64}$/.test(id)) throw new PaperError('Invalid paper ID.'); return path.join(/*turbopackIgnore: true*/ dataDirectory(),`${id}.${ext}`); }
export async function getPaper(id: string): Promise<PaperRecord> {
  try { return JSON.parse(await readFile(/*turbopackIgnore: true*/ filePath(id),'utf8')); }
  catch(error) { if ((error as NodeJS.ErrnoException).code==='ENOENT') throw new PaperError('Paper not found.',404); throw error; }
}
export async function savePaper(paper: PaperRecord) {
  await mkdir(dataDirectory(),{recursive:true});
  const destination = filePath(paper.id), temp = `${destination}.${randomUUID()}.tmp`;
  await writeFile(temp,JSON.stringify(paper),'utf8'); await rename(temp,destination);
}
export async function saveOriginal(id: string, bytes: Uint8Array) { await mkdir(dataDirectory(),{recursive:true}); await writeFile(filePath(id,'pdf'),bytes,{flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;}); }
export async function originalPdf(id: string) { return readFile(/*turbopackIgnore: true*/ filePath(id,'pdf')); }
export async function listPapers(): Promise<PaperSummary[]> {
  await mkdir(dataDirectory(),{recursive:true});const names = await readdir(/*turbopackIgnore: true*/ dataDirectory()); const summaries: PaperSummary[]=[];
  for(const name of names.filter(n=>/^[a-f0-9]{64}\.json$/.test(n))) { const p=await getPaper(name.slice(0,-5)); summaries.push({id:p.id,title:p.extraction.title,filename:p.filename,pageCount:p.extraction.pageCount,analyzed:!!p.analysis,createdAt:p.createdAt}); }
  return summaries.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export async function withPaperLock<T>(id: string, fn:()=>Promise<T>):Promise<T> {
  await mkdir(dataDirectory(),{recursive:true});const lockPath=filePath(id,'lock');
  let handle;
  try { handle=await open(lockPath,'wx'); } catch(error) { if ((error as NodeJS.ErrnoException).code==='EEXIST') throw new PaperError('This paper is already being processed. Wait, then reopen it.',409); throw error; }
  try { return await fn(); } finally { await handle.close();await unlink(lockPath); }
}
