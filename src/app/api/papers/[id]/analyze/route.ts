import { analyzePaper } from '@/lib/papers/analysis';
import { getPaper, savePaper, withPaperLock } from '@/lib/papers/storage';
import { apiError, sameOrigin } from '@/lib/papers/errors';
export const runtime='nodejs';
export const maxDuration=420;
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  try{sameOrigin(request);const {id}=await params;
    const existing=await getPaper(id);if(existing.analysis)return Response.json({paper:existing,cached:true});
    return await withPaperLock(id,async()=>{const paper=await getPaper(id);if(paper.analysis)return Response.json({paper,cached:true});paper.analysis=await analyzePaper(paper);await savePaper(paper);return Response.json({paper,cached:false});});
  }catch(e){return apiError(e);}
}
