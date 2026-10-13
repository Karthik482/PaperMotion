import { test, expect } from '@playwright/test';
import { createTestPdf } from '../helpers/paperFixture';
import { extractPdf } from '../../src/lib/papers/extraction';
import { paperId, savePaper } from '../../src/lib/papers/storage';
import type { Analysis } from '../../src/lib/papers/schemas';
test('upload extracts a paper, rejects invalid inputs, persists and reports missing key',async({page,request})=>{
 const uploadPdf=createTestPdf('Measuring Water Retention in Soil '+Date.now());
 await page.goto('/papers');await expect(page.getByRole('heading',{name:'Start with a paper.'})).toBeVisible();
 await page.getByLabel('Research paper PDF').setInputFiles({name:'soil.pdf',mimeType:'application/pdf',buffer:uploadPdf});
 await page.getByRole('button',{name:'Extract paper'}).click();await expect(page).toHaveURL(/\/papers\/[a-f0-9]{64}$/);
 await expect(page.getByRole('heading',{level:1})).toContainText('Measuring Water Retention');await expect(page.locator('.source-passage').filter({hasText:/water retention/}).first()).toContainText('water retention');
 await page.getByText('Figure captions (1)',{exact:true}).click();await expect(page.locator('.figure-page-preview')).toBeVisible();await expect.poll(()=>page.locator('.figure-page-preview').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
 const url=page.url();await page.reload();await expect(page.getByRole('heading',{level:1})).toContainText('Measuring Water Retention');
 await page.getByRole('button',{name:'Analyze paper',exact:true}).click();await expect(page.locator('.research-error[role=alert]')).toContainText('OPENAI_API_KEY');
 const invalid=await request.post('/api/papers',{multipart:{file:{name:'bad.pdf',mimeType:'application/pdf',buffer:Buffer.from('invalid')}}});expect(invalid.status()).toBe(400);
 const large=await request.post('/api/papers',{multipart:{file:{name:'large.pdf',mimeType:'application/pdf',buffer:Buffer.alloc(20*1024*1024+1)}}});expect(large.status()).toBe(413);
 const evil=await request.post('/api/papers',{data:{url:'https://localhost/secrets'}});expect(evil.status()).toBe(400);
 const duplicate=await request.post('/api/papers',{multipart:{file:{name:'same.pdf',mimeType:'application/pdf',buffer:uploadPdf}}});const dup=await duplicate.json();expect(dup.cached).toBe(true);expect(url).toContain(dup.paper.id);
});
test('saved analysis: level switch, citation evidence, concept map, cached reopening and mobile',async({page,request})=>{
 const bytes=createTestPdf(),id=paperId(bytes),extraction=await extractPdf(bytes,'soil.pdf');
 const passage=extraction.passages.find(p=>p.text.includes('Clay retained more water'))!;
 const evidence=[{passageId:passage.id,quote:'Clay retained more water than sand in this laboratory experiment.'}];
 const claim={beginner:'Clay held more water in the experiment.',technical:'Measured clay retention exceeded sand retention in the tested samples.',evidence};
 const result:Analysis={summary:claim,coreIdeas:[claim],methodology:[claim],findings:[claim],limitations:[],concepts:['clay','sand','retention'].map(conceptId=>({id:conceptId,name:conceptId,...claim})),relationships:[{from:'clay',to:'retention',relation:'Clay retained water.',evidence}],readingOrder:['clay','sand','retention'],uncertainties:[]};
 // This is a test-only fixture in the isolated test data directory, not live AI output.
 await savePaper({id,filename:'soil.pdf',source:{kind:'upload'},createdAt:new Date().toISOString(),extraction,analysis:{version:1,model:'test fixture',createdAt:new Date().toISOString(),result,review:{approved:true,issues:[]}}});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`/papers/${id}`);await expect(page.locator('.analysis-summary')).toContainText(claim.beginner);
 await page.getByRole('button',{name:'Technical',exact:true}).click();await expect(page.locator('.analysis-summary')).toContainText(claim.technical);
 await page.getByRole('button',{name:`View evidence ${passage.id}`,exact:true}).first().click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('.evidence-dialog blockquote')).toHaveText(evidence[0].quote);await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.getByRole('button',{name:'Concept map',exact:true}).click();await expect(page.locator('.concept-card')).toHaveCount(3);
 const cache=await request.post(`/api/papers/${id}/analyze`);expect(cache.ok()).toBe(true);expect((await cache.json()).cached).toBe(true);
 await page.reload();await expect(page.getByRole('button',{name:'Analyze paper',exact:true})).toHaveCount(0);
 await page.screenshot({path:'test-results/paper-analysis-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Concept map',exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/paper-concepts-mobile.png',fullPage:true});expect(errors).toEqual([]);
});
