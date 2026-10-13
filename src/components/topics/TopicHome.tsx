"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, LoaderCircle } from "lucide-react";
import { PaperShell } from "@/components/papers/PaperShell";
import type { TopicSummary } from "@/lib/topics/schemas";
import { toyAttention } from "@/lib/attention";
const examples = [
  "How does a CPU work?",
  "Why does a LEFT JOIN return NULL?",
  "How does gradient descent learn?",
  "How does DNA replication work?",
];
const previewWords = ["The", "robot", "learned", "to", "read", "papers"];
export function TopicHome() {
  const [previewQuery, setPreviewQuery] = useState(2);
  const previewSource = 30 + previewQuery * 60;
  const router = useRouter(),
    [topic, setTopic] = useState(""),
    [level, setLevel] = useState<"beginner" | "technical">("beginner"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [lessons, setLessons] = useState<TopicSummary[]>([]),
    [references, setReferences] = useState<TopicSummary[]>([]),
    [ready, setReady] = useState<boolean | null>(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/topics", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setLessons(d.lessons);
        setReferences(d.references || []);
        setReady(d.plannerReady);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  async function create() {
    setError("");
    if (topic.trim().length < 3) {
      setError("Enter a topic with at least 3 characters.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, level, engineVersion: 3 }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      router.push(`/learn/${d.lesson.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create a lesson.");
      setBusy(false);
    }
  }
  return (
    <PaperShell className="topic-home">
      <section className="home-opening">
        <div className="home-question">
          <span className="eyebrow">FOLLOW YOUR CURIOSITY</span>
          <h1>
            What would you like
            <br />
            to understand?
          </h1>
          <p className="home-intro">
            Take an idea apart, connect the pieces, and test your understanding.
          </p>
          <section className="topic-entry" aria-label="Create a learning path">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void create();
              }}
            >
              <div className="topic-input-heading">
                <label htmlFor="topic">Topic or question</label>
                <label className="topic-level">
                  Learning level
                  <select
                    aria-label="Learning level"
                    value={level}
                    onChange={(e) =>
                      setLevel(e.target.value as "beginner" | "technical")
                    }
                    disabled={busy}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="technical">Technical</option>
                  </select>
                </label>
              </div>
              <div className="topic-input-row">
                <input
                  id="topic"
                  maxLength={240}
                  placeholder="How does a CPU work?"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={busy}
                />
                <button
                  className="research-primary"
                  disabled={busy || !topic.trim()}
                >
                  {busy ? (
                    <>
                      <LoaderCircle className="spin" size={16} /> Building your
                      path...
                    </>
                  ) : (
                    <>
                      Create learning path <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
              <div className="topic-input-note">
                <span>
                  Interactive scenes &middot; explanations &middot; checks
                </span>
                <span>{topic.length}/240</span>
              </div>
            </form>
            <div className="topic-examples">
              <span>Or start here</span>
              {examples.map((x) => (
                <button
                  disabled={busy}
                  key={x}
                  onClick={() => {
                    setTopic(x);
                    document.getElementById("topic")?.focus();
                  }}
                >
                  {x}
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
            {busy && (
              <p role="status" className="research-status">
                Planning concepts, checking explanations, and matching available
                interactions. This may take a minute.
              </p>
            )}
            {error && (
              <p role="alert" className="research-error">
                {error}
              </p>
            )}
            {ready === false && (
              <div className="config-note">
                <strong>Connect your API key to create a learning path.</strong>
                <span>
                  Add OPENAI_API_KEY to .env.local and restart. You can explore
                  the Transformer lab now.
                </span>
              </div>
            )}
          </section>
        </div>
        <aside className="home-feature">
          <div className="feature-heading">
            <span className="eyebrow">THE INTERACTIVE EDITION</span>
            <span>01 / Transformer</span>
          </div>
          <div
            className="feature-diagram"
            role="group"
            aria-label="Self-attention preview"
          >
            <span className="feature-query">{previewWords[previewQuery]}</span>
            <svg viewBox="0 0 360 170" aria-hidden="true">
              {toyAttention(previewQuery, 1).weights.map((w, i) => (
                <path
                  key={i}
                  d={`M${previewSource} 8C${previewSource} 80 ${30 + i * 60} 80 ${30 + i * 60} 154`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1 + w * 10}
                  opacity={0.3 + w * 0.7}
                />
              ))}
              <circle cx={previewSource} cy="8" r="5" fill="currentColor" />
            </svg>
            <div>
              {previewWords.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={previewQuery === i}
                  onClick={() => setPreviewQuery(i)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <span className="feature-caption">
            Illustrative attention · select a word to explore
          </span>
          <Link href="/lessons/transformer" className="feature-link">
            <h2>Inside the Transformer</h2>
            <ArrowUpRight size={24} />
          </Link>
          <p>
            Select a word. Adjust its attention. Explore the architecture that
            changed language models.
          </p>
          <Link href="/lessons/transformer" className="text-link">
            Open the interactive lesson <ArrowRight size={16} />
          </Link>
          <div className="feature-meta">
            <span>Vaswani et al. &middot; 2017</span>
            <span>6 modules</span>
          </div>
        </aside>
      </section>
      <section
        className="reference-lessons"
        aria-label="Reference learning paths"
      >
        <div className="research-section-heading">
          <div>
            <span className="eyebrow">EXPLORE THE ENGINE</span>
            <h2>Five ways to understand</h2>
          </div>
          <span>Ready to explore · no generation needed</span>
        </div>
        <div className="reference-grid">
          {references.map((r, i) => (
            <Link href={`/learn/${r.id}`} key={r.id} className="reference-link">
              <span className="eyebrow">
                {String(i + 1).padStart(2, "0")} / {r.domain}
              </span>
              <h3>{r.title}</h3>
              <span>
                Explore the reference lesson <ArrowUpRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="saved-topics">
        <div className="research-section-heading">
          <div>
            <span className="eyebrow">YOUR NOTEBOOK</span>
            <h2>Pick up where you left off</h2>
          </div>
          <span>{lessons.length} saved</span>
        </div>
        {loading ? (
          <p role="status">Loading your learning paths...</p>
        ) : lessons.length ? (
          <div className="paper-list">
            {lessons.map((l, i) => (
              <Link href={`/learn/${l.id}`} key={l.id} className="saved-paper">
                <span className="saved-index">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{l.title}</h3>
                  <p>
                    {l.domain} &middot; {l.stepCount} steps &middot;{" "}
                    {l.level === "technical" ? "Technical" : "Beginner"}{" "}
                    &middot; Saved lesson
                  </p>
                </div>
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-library">
            <h3>A question is a good place to begin.</h3>
            <p>
              Create a path above. Saved lessons reopen without another planning
              call.
            </p>
          </div>
        )}
      </section>
      <section className="paper-entry">
        <div>
          <span className="eyebrow">FROM THE ORIGINAL SOURCE</span>
          <Link href="/papers">
            <h2>
              Learn from research <ArrowUpRight size={24} />
            </h2>
          </Link>
          <p>
            Bring a PDF or an arXiv paper. Explore its ideas and trace every
            citation back to the evidence.
          </p>
        </div>
        <Link href="/papers" className="text-link">
          Open paper library <ArrowRight size={16} />
        </Link>
      </section>
    </PaperShell>
  );
}
