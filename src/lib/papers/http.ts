import { PaperError } from './errors';
import { readLimited } from './ingestion';
export async function limitedBody(request: Request, limit: number) {
  if(Number(request.headers.get('content-length'))>limit) throw new PaperError('The request exceeds the size limit.',413);
  return readLimited(new Response(request.body,{headers:request.headers}),limit);
}
export async function jsonBody(request: Request) {
  try { return JSON.parse(Buffer.from(await limitedBody(request,4096)).toString('utf8')); }
  catch(error) { if(error instanceof PaperError)throw error;throw new PaperError('Invalid JSON request.'); }
}
