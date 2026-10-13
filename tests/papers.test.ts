import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { extractPdf, renderPdfPage } from '../src/lib/papers/extraction';
import { parseArxivUrl, MAX_PDF_BYTES, validatePdf, readLimited } from '../src/lib/papers/ingestion';
import { validateAnalysis, type Analysis, type Passage } from '../src/lib/papers/schemas';
import { getPaper, paperId, savePaper, withPaperLock } from '../src/lib/papers/storage';
import { createTestPdf } from './helpers/paperFixture';
export const passages:Passage[]=[{id:'p1-1',page:1,section:'Results',text:'Clay retained more water than sand in this laboratory experiment. The small sample size limits generalization.'}];
export function validAnalysis():Analysis {
 const evidence=[{passageId:'p1-1',quote:'Clay retained more water than sand in this laboratory experiment.'}];const claim={beginner:'Clay held more water in the experiment.',technical:'Measured clay retention exceeded sand retention in the tested samples.',evidence};
 return {summary:claim,coreIdeas:[claim],methodology:[claim],findings:[claim],limitations:[],concepts:['clay','sand','retention'].map(id=>({id,name:id,...claim})),relationships:[{from:'clay',to:'retention',relation:'Clay retained water.',evidence}],readingOrder:['clay','sand','retention'],uncertainties:[]};
}
test('arXiv validates modern, versioned and legacy identifiers; blocks other hosts and redirects',()=>{
 assert.equal(parseArxivUrl('https://arxiv.org/abs/1808.03314v3').id,'1808.03314v3');assert.equal(parseArxivUrl('https://arxiv.org/pdf/hep-th/9901001.pdf').id,'hep-th/9901001');
 for(const url of ['http://arxiv.org/abs/1808.03314','https://arxiv.org.evil.test/abs/1808.03314','https://localhost/abs/1808.03314','https://arxiv.org/abs/../../test','https://user@arxiv.org/abs/1808.03314','https://arxiv.org/abs/1808.03314?redirect=evil','https://arxiv.org/abs/garbage'])assert.throws(()=>parseArxivUrl(url));
});
test('invalid and oversized PDFs rejected; streaming limit enforced',async()=>{assert.throws(()=>validatePdf(Buffer.from('not a pdf'),'paper.pdf'));assert.throws(()=>validatePdf(new Uint8Array(MAX_PDF_BYTES+1),'paper.pdf'));await assert.rejects(()=>readLimited(new Response('1234567890'),5));});
test('real PDF parsing creates evidence, abstract, sections, captions, equations and references',async()=>{const e=await extractPdf(createTestPdf(),'soil.pdf');assert.match(e.title,/Measuring Water/);assert.match(e.abstract,/water retention/);assert.ok(e.sections.length>=5);assert.equal(e.figures.length,1);assert.equal(e.equations.length,1);assert.ok(e.references.length);assert.ok(e.passages.every(p=>p.page===1&&p.id.startsWith('p1-')));assert.ok(!e.passages.some(p=>/Transformer/.test(p.text)));});
test('malformed PDF parser failure is explicit',async()=>{await assert.rejects(()=>extractPdf(Buffer.from('%PDF-1.4 damaged'),'bad.pdf'),/Could not read/);});
test('original page rendering preserves figure context without generated imagery',async()=>{const png=await renderPdfPage(createTestPdf(),1);assert.equal(png.subarray(1,4).toString(),'PNG');assert.ok(png.length>1000);await assert.rejects(()=>renderPdfPage(createTestPdf(),2),/Page not found/);});
test('citation IDs and exact quotes are checked across every analysis category',()=>{
 assert.ok(validateAnalysis(validAnalysis(),passages));
 for(const field of ['summary','coreIdeas','methodology','findings','concepts','relationships'] as const){const a=validAnalysis();const item=field==='summary'?a.summary:a[field][0];item.evidence=[{passageId:'fabricated',quote:'This passage is fabricated.'}];assert.throws(()=>validateAnalysis(a,passages),/Nonexistent passage/);}
 const a=validAnalysis();a.summary.evidence[0].quote='The Transformer uses multi-head attention.';assert.throws(()=>validateAnalysis(a,passages),/Quote does not match/);
});
test('concept counts, endpoints, duplicates and reading order validated',()=>{const a=validAnalysis();a.concepts=a.concepts.slice(0,2);assert.throws(()=>validateAnalysis(a,passages));const b=validAnalysis();b.relationships[0].to='missing';assert.throws(()=>validateAnalysis(b,passages));const c=validAnalysis();c.readingOrder=['clay','sand','missing'];assert.throws(()=>validateAnalysis(c,passages));});
test('durable storage, duplicate fingerprint and concurrent analysis lock',async()=>{const dir=await mkdtemp(path.join(os.tmpdir(),'papermotion-test-'));const old=process.env.PAPERMOTION_DATA_DIR;process.env.PAPERMOTION_DATA_DIR=dir;try{const bytes=createTestPdf(),id=paperId(bytes);assert.equal(id,paperId(Buffer.from(bytes)));const extraction=await extractPdf(bytes,'soil.pdf');const record={id,filename:'soil.pdf',source:{kind:'upload' as const},createdAt:new Date().toISOString(),extraction,analysis:{version:1 as const,model:'test',createdAt:new Date().toISOString(),result:validAnalysis(),review:{approved:true,issues:[]}}};await savePaper(record);assert.deepEqual(await getPaper(id),record);await withPaperLock(id,async()=>{await assert.rejects(()=>withPaperLock(id,async()=>{}),/already being processed/);});await withPaperLock(id,async()=>{});await assert.rejects(()=>getPaper('../escape'));}finally{if(old===undefined)delete process.env.PAPERMOTION_DATA_DIR;else process.env.PAPERMOTION_DATA_DIR=old;await rm(dir,{recursive:true,force:true});}});
