"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileText,
  LoaderCircle,
  X,
} from "lucide-react";
import type {
  Claim,
  Evidence,
  PaperRecord,
  ExtractedItem,
} from "@/lib/papers/schemas";
import { ExplanationSwitch } from "@/components/layout/ExplanationSwitch";
import { PaperShell } from "./PaperShell";
import { PaperTutor } from "@/components/tutor/PaperTutor";
export function PaperReader({ id }: { id: string }) {
  const [tutorConcept, setTutorConcept] = useState("summary");
  const [paper, setPaper] = useState<PaperRecord | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [mode, setMode] = useState<"beginner" | "technical">("beginner"),
    [tab, setTab] = useState<"analysis" | "concepts" | "source">("source"),
    [evidence, setEvidence] = useState<Evidence | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    fetch(`/api/papers/${id}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setPaper(d.paper);
        if (d.paper.analysis) setTab("analysis");
      })
      .catch((e) => setError(e.message));
  }, [id]);
  async function analyze() {
    setError("");
    setBusy(true);
    try {
      const r = await fetch(`/api/papers/${id}/analyze`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setPaper(d.paper);
      setTab("analysis");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not analyze the paper.");
    } finally {
      setBusy(false);
    }
  }
  function openEvidence(e: Evidence) {
    setEvidence(e);
    dialog.current?.showModal();
  }
  function citations(list: Evidence[]) {
    return (
      <div className="citation-links">
        {list.map((e, i) => (
          <button
            key={`${e.passageId}-${i}`}
            onClick={() => openEvidence(e)}
            aria-label={`View evidence ${e.passageId}`}
          >
            <FileText size={11} />
            {e.passageId}
          </button>
        ))}
      </div>
    );
  }
  function claim(c: Claim, i: number) {
    return (
      <div className="claim" key={i}>
        <p>{c[mode]}</p>
        {citations(c.evidence)}
      </div>
    );
  }
  function exportJson() {
    if (!paper) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ schemaVersion: 1, paper }, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `papermotion-${id.slice(0, 12)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const passage = paper?.extraction.passages.find(
    (p) => p.id === evidence?.passageId,
  );
  const analysis = paper?.analysis?.result;
  function extractedItems(
    items: ExtractedItem[],
    empty: string,
    preview = false,
  ) {
    return items.length ? (
      items.map((item, i) => (
        <div className="extracted-item" key={i}>
          <span>Page {item.page}</span>
          <pre>{item.text}</pre>
          {preview && (
            <img
              className="figure-page-preview"
              src={`/api/papers/${id}/pages/${item.page}`}
              alt={`Original PDF page ${item.page}, including figure and surrounding context`}
              loading="lazy"
            />
          )}
          <a
            href={`/api/papers/${id}/pdf#page=${item.page}`}
            target="_blank"
            rel="noreferrer"
          >
            View original page <ArrowUpRight size={12} />
          </a>
        </div>
      ))
    ) : (
      <p className="source-empty">{empty}</p>
    );
  }
  return (
    <PaperShell>
      <Link className="back-library" href="/papers">
        <ArrowLeft size={14} /> Back to paper library
      </Link>
      {!paper ? (
        <div className="reader-loading">
          {error ? (
            <p role="alert" className="research-error">
              {error}
            </p>
          ) : (
            <p role="status">Loading your paper…</p>
          )}
        </div>
      ) : (
        <>
          <section className="reader-heading">
            <div>
              <span className="eyebrow">
                {paper.source.kind === "arxiv"
                  ? "IMPORTED FROM ARXIV"
                  : "YOUR RESEARCH PAPER"}
              </span>
              <h1>{paper.extraction.title}</h1>
              {paper.extraction.authors.length > 0 && (
                <p>{paper.extraction.authors.join(", ")}</p>
              )}
              <div className="reader-meta">
                <span>{paper.extraction.pageCount} pages</span>
                <span>{paper.extraction.passages.length} source passages</span>
                <span className="paper-state analyzed">
                  {paper.analysis ? (
                    <>
                      <CheckCircle2 size={12} /> Analysis saved
                    </>
                  ) : (
                    "Text extracted"
                  )}
                </span>
              </div>
            </div>
            <div className="reader-actions">
              <a
                href={`/api/papers/${id}/pdf`}
                target="_blank"
                rel="noreferrer"
              >
                Original PDF <ArrowUpRight size={14} />
              </a>
              <button onClick={exportJson}>
                <Download size={14} /> Export JSON
              </button>
            </div>
          </section>
          {error && (
            <p role="alert" className="research-error">
              {error}
            </p>
          )}
          {!paper.analysis && (
            <section className="analyze-banner">
              <div>
                <span className="eyebrow">READY TO UNDERSTAND</span>
                <h3>Turn the paper into a structured lesson foundation.</h3>
                <p>
                  Get evidence-linked ideas, methods, findings, limitations, and
                  3–7 connected concepts.
                </p>
                <small>
                  Uses your OpenAI API key for analysis and a separate grounding
                  review. No new visualizations are generated.
                </small>
              </div>
              <button
                disabled={busy}
                className="research-primary"
                onClick={analyze}
              >
                {busy ? (
                  <>
                    <LoaderCircle className="spin" size={16} /> Analyzing &
                    reviewing…
                  </>
                ) : (
                  "Analyze paper"
                )}
              </button>
            </section>
          )}
          {busy && (
            <p role="status" className="research-status">
              Reading the extracted evidence, then checking each claim. This may
              take a few minutes. Keep this page open.
            </p>
          )}
          <div className="reader-controls">
            <nav aria-label="Paper views">
              {(["analysis", "concepts", "source"] as const).map((t) => (
                <button
                  key={t}
                  aria-pressed={tab === t}
                  disabled={t !== "source" && !analysis}
                  className={tab === t ? "selected" : ""}
                  onClick={() => setTab(t)}
                >
                  {t === "source"
                    ? "Extracted source"
                    : t === "concepts"
                      ? "Concept map"
                      : "Research analysis"}
                </button>
              ))}
            </nav>
            {tab !== "source" && (
              <ExplanationSwitch value={mode} onChange={setMode} />
            )}
          </div>
          {tab === "analysis" && analysis && (
            <div className="analysis-layout">
              <section className="analysis-main">
                <div className="analysis-summary">
                  <span className="eyebrow">THE PAPER IN A NUTSHELL</span>
                  {claim(analysis.summary, 0)}
                </div>
                {[
                  { title: "Core ideas", claims: analysis.coreIdeas },
                  { title: "Methodology", claims: analysis.methodology },
                  { title: "Findings", claims: analysis.findings },
                ].map((group) => (
                  <section className="analysis-section" key={group.title}>
                    <h2>{group.title}</h2>
                    {group.claims.map(claim)}
                  </section>
                ))}
                <section className="analysis-section">
                  <h2>Limitations</h2>
                  {analysis.limitations.length ? (
                    analysis.limitations.map((c, i) => (
                      <div key={i}>
                        <span className="limitation-kind">
                          {c.kind === "inferred"
                            ? "Analyst inference"
                            : "Stated by the paper"}
                        </span>
                        {claim(c, i)}
                      </div>
                    ))
                  ) : (
                    <p>No evidence-supported limitations were identified.</p>
                  )}
                </section>
                {analysis.uncertainties.length > 0 && (
                  <section className="uncertainties">
                    <h3>What remains uncertain</h3>
                    <ul>
                      {analysis.uncertainties.map((u) => (
                        <li key={u}>{u}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </section>
              <aside className="analysis-notes">
                <PaperTutor
                  key={`${id}:${tutorConcept}`}
                  paper={paper}
                  conceptId={tutorConcept}
                  level={mode}
                />
                <span className="eyebrow">FOLLOW THE EVIDENCE</span>
                <h3>Understanding starts at the source.</h3>
                <p>
                  Click any passage citation to read its exact excerpt and
                  surrounding text.
                </p>
                <p>
                  Beginner and technical views explain the same ideas at
                  different levels.
                </p>
                <span className="review-status">
                  <CheckCircle2 size={15} /> Grounding review passed
                </span>
                <small>
                  AI checks reduce errors, but cannot guarantee correctness.
                  Compare important claims with the original PDF.
                </small>
              </aside>
            </div>
          )}
          {tab === "concepts" && analysis && (
            <section className="concept-section">
              <div className="research-section-heading">
                <div>
                  <span className="eyebrow">A STRUCTURED LEARNING PATH</span>
                  <h2>{analysis.concepts.length} ideas to connect</h2>
                </div>
                <span>Read in this order</span>
              </div>
              <div className="concept-grid">
                {analysis.readingOrder.map((conceptId, i) => {
                  const c = analysis.concepts.find((c) => c.id === conceptId)!;
                  return (
                    <article className="concept-card" key={c.id}>
                      <span className="concept-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3>{c.name}</h3>
                      <p>{c[mode]}</p>
                      {citations(c.evidence)}
                      <button
                        onClick={() => {
                          setTutorConcept(c.id);
                          setTab("analysis");
                        }}
                        className="text-link"
                      >
                        Ask about this concept
                      </button>
                    </article>
                  );
                })}
              </div>
              <section className="concept-relations">
                <h3>How the ideas relate</h3>
                {analysis.relationships.length ? (
                  analysis.relationships.map((r, i) => (
                    <div className="concept-relation" key={i}>
                      <div>
                        <strong>
                          {analysis.concepts.find((c) => c.id === r.from)?.name}
                        </strong>
                        <span>→</span>
                        <strong>
                          {analysis.concepts.find((c) => c.id === r.to)?.name}
                        </strong>
                      </div>
                      <p>{r.relation}</p>
                      {citations(r.evidence)}
                    </div>
                  ))
                ) : (
                  <p>No evidence-supported relationships were identified.</p>
                )}
              </section>
              <p className="phase-note">
                Concepts, relationships, evidence, and reading order are saved
                as structured data for Phase 3.
              </p>
            </section>
          )}
          {tab === "source" && (
            <section className="source-section">
              <div className="extraction-warnings">
                <strong>About this extraction</strong>
                <ul>
                  {paper.extraction.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
              <details className="source-detail" open>
                <summary>Abstract</summary>
                <p>
                  {paper.extraction.abstract ||
                    "No separate abstract detected. Read the first-page passages below."}
                </p>
              </details>
              <details className="source-detail">
                <summary>Sections ({paper.extraction.sections.length})</summary>
                <ul>
                  {paper.extraction.sections.map((s, i) => (
                    <li key={i}>
                      {s.title} <span>— page {s.page}</span>
                    </li>
                  ))}
                </ul>
              </details>
              <details className="source-detail">
                <summary>
                  Equation candidates ({paper.extraction.equations.length})
                </summary>
                {extractedItems(
                  paper.extraction.equations,
                  "No numbered equations were reliably detected. Check the original PDF.",
                )}
              </details>
              <details className="source-detail">
                <summary>
                  Figure captions ({paper.extraction.figures.length})
                </summary>
                {extractedItems(
                  paper.extraction.figures,
                  "No figure captions were detected. Check the original PDF.",
                  true,
                )}
              </details>
              <details className="source-detail">
                <summary>
                  Reference passages ({paper.extraction.references.length})
                </summary>
                {extractedItems(
                  paper.extraction.references,
                  "No reference section was reliably detected.",
                )}
              </details>
              <h2>Extracted evidence</h2>
              <p className="source-description">
                Stable passage IDs let you trace the analysis back to the paper.
                Text is shown as extracted, including imperfect symbols.
              </p>
              <div className="passage-list">
                {paper.extraction.passages.map((p) => (
                  <article id={p.id} className="source-passage" key={p.id}>
                    <div>
                      <span>{p.id}</span>
                      <span>
                        Page {p.page} · {p.section}
                      </span>
                      <a
                        href={`/api/papers/${id}/pdf#page=${p.page}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Original page <ArrowUpRight size={12} />
                      </a>
                    </div>
                    <pre>{p.text}</pre>
                  </article>
                ))}
              </div>
            </section>
          )}
          <div className="reader-provenance">
            {paper.analysis
              ? `Saved analysis · ${paper.analysis.model} · schema v${paper.analysis.version} · reopening uses no API calls`
              : "Extracted content saved locally · analysis has not run"}
          </div>
        </>
      )}
      <dialog
        ref={dialog}
        className="evidence-dialog"
        aria-labelledby="evidence-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <div className="evidence-top">
          <span className="eyebrow">SOURCE EVIDENCE</span>
          <button
            aria-label="Close evidence"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        {evidence && passage && (
          <>
            <h2 id="evidence-title">
              {passage.id} <span>· Page {passage.page}</span>
            </h2>
            <p className="evidence-section">{passage.section}</p>
            <blockquote>{evidence.quote}</blockquote>
            <h3>Surrounding passage</h3>
            <pre>{passage.text}</pre>
            <a
              href={`/api/papers/${id}/pdf#page=${passage.page}`}
              target="_blank"
              rel="noreferrer"
            >
              View original PDF page <ArrowUpRight size={15} />
            </a>
          </>
        )}
      </dialog>
    </PaperShell>
  );
}
