import { getPaper } from '@/lib/papers/storage';
import { apiError } from '@/lib/papers/errors';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {try{const {id}=await params;return Response.json({paper:await getPaper(id)},{headers:{'Cache-Control':'no-store'}});}catch(e){return apiError(e);}}
