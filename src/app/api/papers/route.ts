import { apiError, PaperError, sameOrigin } from '@/lib/papers/errors';
import { downloadArxiv, MAX_PDF_BYTES, validatePdf } from '@/lib/papers/ingestion';
import { extractPdf } from '@/lib/papers/extraction';
import { getPaper, listPapers, paperId, saveOriginal, savePaper, withPaperLock } from '@/lib/papers/storage';
import { jsonBody, limitedBody } from '@/lib/papers/http';
import type { PaperRecord } from '@/lib/papers/schemas';
export const runtime='nodejs';
export async function GET() {try{return Response.json({papers:await listPapers(),analysisReady:!!process.env.OPENAI_API_KEY?.trim()},{headers:{'Cache-Control':'no-store'}});}catch(e){return apiError(e);}}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    let bytes:Uint8Array,filename:string,source:PaperRecord['source'];
    const type=request.headers.get('content-type')||'';
    if(type.startsWith('multipart/form-data')) {
      const body=await limitedBody(request,MAX_PDF_BYTES+1024*1024);
      const form=await new Response(Buffer.from(body),{headers:{'content-type':type}}).formData();
      const file=form.get('file');
      if(!(file instanceof File)) throw new PaperError('Choose a PDF file.');
      if(file.size>MAX_PDF_BYTES) throw new PaperError('PDFs must be 20 MB or smaller.',413);
      filename=file.name.slice(0,200);bytes=new Uint8Array(await file.arrayBuffer());source={kind:'upload'};validatePdf(bytes,filename);
    } else if(type.startsWith('application/json')) {
      const input=await jsonBody(request);
      if(typeof input?.url!=='string') throw new PaperError('An arXiv URL is required.');
      ({bytes,filename,source}=await downloadArxiv(input.url));
    } else throw new PaperError('Use a PDF upload or an arXiv URL.',415);
    const id=paperId(bytes);
    try { return Response.json({paper:await getPaper(id),cached:true}); } catch(e){if(!(e instanceof PaperError&&e.status===404))throw e;}
    return await withPaperLock(id,async()=>{
      // Recheck after locking: another upload may have finished extraction.
      try {return Response.json({paper:await getPaper(id),cached:true});}catch(e){if(!(e instanceof PaperError&&e.status===404))throw e;}
      const extraction=await extractPdf(bytes,filename);
      const paper:PaperRecord={id,filename,source,createdAt:new Date().toISOString(),extraction,analysis:null};
      await saveOriginal(id,bytes);await savePaper(paper);
      return Response.json({paper,cached:false},{status:201});
    });
  } catch(e){return apiError(e);}
}
