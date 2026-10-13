import { originalPdf } from '@/lib/papers/storage';
import { apiError, PaperError } from '@/lib/papers/errors';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const bytes=await originalPdf(id);return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="paper.pdf"','X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store'}});}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return apiError(new PaperError('Original PDF not found.',404));return apiError(e);}}
