import { z } from 'zod';
export const evidenceSchema = z.object({ passageId: z.string().min(1), quote: z.string().min(12).max(2000) });
function buildAnalysisSchema<T extends z.ZodType>(evidence:T){
const claimSchema = z.object({ beginner: z.string().min(1), technical: z.string().min(1), evidence: z.array(evidence).min(1).max(5) });
return z.object({
  summary: claimSchema,
  coreIdeas: z.array(claimSchema).min(1).max(7),
  methodology: z.array(claimSchema).min(1).max(7),
  findings: z.array(claimSchema).min(1).max(7),
  limitations: z.array(claimSchema.extend({ kind: z.enum(['paper-stated', 'inferred']) })).max(7),
  concepts: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), beginner: z.string().min(1), technical: z.string().min(1), evidence: z.array(evidence).min(1).max(5) })).min(3).max(7),
  relationships: z.array(z.object({ from: z.string(), to: z.string(), relation: z.string().min(1), evidence: z.array(evidence).min(1).max(3) })).max(20),
  readingOrder: z.array(z.string()).min(3).max(7),
  uncertainties: z.array(z.string()).max(10),
});}
export const analysisSchema=buildAnalysisSchema(evidenceSchema);
export const analysisReferenceSchema=buildAnalysisSchema(z.object({passageId:z.string().min(1)}));
export const reviewSchema = z.object({ approved: z.boolean(), issues: z.array(z.string()).max(20) });
export type Evidence = z.infer<typeof evidenceSchema>;
export type Analysis = z.infer<typeof analysisSchema>;
export type Claim = Analysis['summary'];
export type Passage = { id: string; page: number; section: string; text: string };
export type ExtractedItem = { text: string; page: number; passageIds: string[] };
export type Extraction = {
  title: string; authors: string[]; abstract: string; pageCount: number;
  pages: { page: number; text: string; headings?: string[] }[]; passages: Passage[];
  sections: { title: string; page: number; passageIds: string[] }[];
  equations: ExtractedItem[]; figures: ExtractedItem[]; references: ExtractedItem[]; warnings: string[];
};
export type PaperRecord = {
  id: string; filename: string; source: { kind: 'upload' | 'arxiv'; url?: string; arxivId?: string };
  createdAt: string; extraction: Extraction;
  analysis: null | { version: 1; model: string; createdAt: string; result: Analysis; review: z.infer<typeof reviewSchema> };
};
export type PaperSummary = { id: string; title: string; filename: string; pageCount: number; analyzed: boolean; createdAt: string };
const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
export function resolveAnalysisEvidence(input:unknown,passages:Passage[]):Analysis{
  const draft=analysisReferenceSchema.parse(input);
  const source=new Map(passages.map(p=>[p.id,p]));
  const hydrate=<T extends {evidence:{passageId:string}[]}>(claim:T)=>({...claim,evidence:claim.evidence.map(e=>{const passage=source.get(e.passageId);if(!passage)throw new Error(`Nonexistent passage ID: ${e.passageId}`);return {passageId:e.passageId,quote:passage.text};})});
  return validateAnalysis({...draft,summary:hydrate(draft.summary),coreIdeas:draft.coreIdeas.map(hydrate),methodology:draft.methodology.map(hydrate),findings:draft.findings.map(hydrate),limitations:draft.limitations.map(hydrate),concepts:draft.concepts.map(hydrate),relationships:draft.relationships.map(hydrate)},passages);
}
export function validateAnalysis(input: unknown, passages: Passage[]): Analysis {
  const analysis = analysisSchema.parse(input);
  const ids = new Set(analysis.concepts.map(c => c.id));
  if (ids.size !== analysis.concepts.length) throw new Error('Duplicate concept IDs');
  if (new Set(analysis.readingOrder).size !== ids.size || analysis.readingOrder.length !== ids.size || analysis.readingOrder.some(id => !ids.has(id))) throw new Error('Invalid concept reading order');
  if (analysis.relationships.some(r => !ids.has(r.from) || !ids.has(r.to) || r.from === r.to)) throw new Error('Invalid concept relationship');
  const source = new Map(passages.map(p => [p.id, p]));
  const claims = [analysis.summary, ...analysis.coreIdeas, ...analysis.methodology, ...analysis.findings, ...analysis.limitations, ...analysis.concepts, ...analysis.relationships];
  for (const claim of claims) for (const citation of claim.evidence) {
    const passage = source.get(citation.passageId);
    if (!passage) throw new Error(`Nonexistent passage ID: ${citation.passageId}`);
    if (!normalize(passage.text).includes(normalize(citation.quote))) throw new Error(`Quote does not match passage: ${citation.passageId}`);
  }
  return analysis;
}
