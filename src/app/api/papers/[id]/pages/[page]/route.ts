import { originalPdf } from '@/lib/papers/storage';
import { renderPdfPage } from '@/lib/papers/extraction';
import { apiError } from '@/lib/papers/errors';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string;page:string}>}){try{const {id,page}=await params;const png=await renderPdfPage(await originalPdf(id),Number(page));return new Response(new Uint8Array(png),{headers:{'Content-Type':'image/png','Cache-Control':'private, max-age=86400','X-Content-Type-Options':'nosniff'}});}catch(e){return apiError(e);}}
