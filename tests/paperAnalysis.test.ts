import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { analyzePaper } from '../src/lib/papers/analysis';
import { resolveAnalysisEvidence, type PaperRecord } from '../src/lib/papers/schemas';
const passage={id:'p1-1',page:1,section:'Results',text:'Clay retained more water than sand in this laboratory experiment. The sample size limits generalization.'};
function draft(){const claim={beginner:'Clay held more water.',technical:'Clay retention exceeded sand retention in the tested samples.',evidence:[{passageId:'p1-1'}]};return {summary:claim,coreIdeas:[claim],methodology:[claim],findings:[claim],limitations:[],concepts:['clay','sand','retention'].map(id=>({id,name:id,...claim})),relationships:[],readingOrder:['clay','sand','retention'],uncertainties:[]};}
const paper:PaperRecord={id:'a'.repeat(64),filename:'soil.pdf',source:{kind:'upload'},createdAt:'2026-01-01',analysis:null,extraction:{title:'Water retention',authors:[],abstract:'',pageCount:1,pages:[{page:1,text:passage.text}],passages:[passage],sections:[],equations:[],figures:[],references:[],warnings:[]}};
test('source evidence is attached by the server; fabricated IDs rejected',()=>{const result=resolveAnalysisEvidence(draft(),[passage]);assert.equal(result.summary.evidence[0].quote,passage.text);const bad=draft();bad.summary.evidence=[{passageId:'fake'}];assert.throws(()=>resolveAnalysisEvidence(bad,[passage]),/Nonexistent passage/);});
test('real SDK pipeline reviews results, blocks invalid citations before review, and rejects unsupported analysis',async()=>{
 let calls=0;let invalid=false;let approve=true;
 const server=createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;const request=JSON.parse(body);assert.equal(request.store,false);assert.ok(!request.input[1].content.includes('Transformer'));calls++;
 const review=request.text.format.name==='grounding_review';const generated=draft();if(invalid)generated.summary.evidence=[{passageId:'fake'}];
 const output=review?{approved:approve,issues:approve?[]:['The claimed finding is unsupported.']}:generated;
 res.setHeader('Content-Type','application/json');res.end(JSON.stringify({id:'resp_test',object:'response',created_at:0,status:'completed',model:'test',output:[{id:'msg_test',type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify(output),annotations:[]}]}]}));});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const oldKey=process.env.OPENAI_API_KEY,oldBase=process.env.OPENAI_BASE_URL;
 process.env.OPENAI_API_KEY='test-only-key';process.env.OPENAI_BASE_URL=`http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
 try{
   const a=await analyzePaper(paper);assert.equal(a.review.approved,true);assert.equal(a.result.summary.evidence[0].quote,passage.text);assert.equal(calls,2);
   invalid=true;await assert.rejects(()=>analyzePaper(paper),/invalid citations/);assert.equal(calls,3);
   invalid=false;approve=false;await assert.rejects(()=>analyzePaper(paper),/grounding review rejected/);assert.equal(calls,5);
   process.env.OPENAI_API_KEY='';await assert.rejects(()=>analyzePaper(paper),/OPENAI_API_KEY/);assert.equal(calls,5);
 }finally{if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;if(oldBase===undefined)delete process.env.OPENAI_BASE_URL;else process.env.OPENAI_BASE_URL=oldBase;await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
