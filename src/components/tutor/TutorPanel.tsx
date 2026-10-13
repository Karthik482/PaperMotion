"use client";
import { useEffect, useId, useRef, useState } from "react";
import type {
  TutorBinding,
  SceneSnapshot,
} from "@/components/scenes/useSceneSession";
import type { TutorProposal } from "@/lib/tutor/proposal";
import {
  appendTurn,
  memorySchema,
  readTutorStream,
  type TutorMemory,
} from "@/lib/tutor/client";
export function TutorPanel({
  binding,
  revision,
  capture,
  apply,
  onAnimation,
  suggestions,
  readOnly = false,
}: {
  binding: TutorBinding;
  revision: number;
  capture: () => SceneSnapshot;
  apply: (p: TutorProposal) => { ok: boolean; feedback: string };
  onAnimation?: (p: TutorProposal) => void;
  suggestions: string[];
  readOnly?: boolean;
}) {
  const [memory, setMemory] = useState<TutorMemory>({ turns: [], summary: "" }),
    [ready, setReady] = useState(false),
    [message, setMessage] = useState(""),
    [pending, setPending] = useState(false),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [proposal, setProposal] = useState<TutorProposal | null>(null),
    [applied, setApplied] = useState(false);
  const requestRef = useRef<AbortController | null>(null),
    generation = useRef(0),
    lastQuestion = useRef(""),
    uid = useId();
  const key = `tutor-memory:v1:${binding.kind}:${binding.lessonId}`;
  useEffect(() => {
    try {
      const saved = memorySchema.safeParse(
        JSON.parse(localStorage.getItem(key) || "null"),
      );
      if (saved.success) setMemory(saved.data);
    } catch {}
    setReady(true);
    return () => {
      generation.current++;
      requestRef.current?.abort();
    };
  }, [key]);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(key, JSON.stringify(memory));
      } catch {}
  }, [memory, ready, key]);
  function stop() {
    generation.current++;
    requestRef.current?.abort();
    requestRef.current = null;
    setPending(false);
    setStatus("Response stopped. The scene was not changed.");
  }
  function clear() {
    stop();
    setMemory({ turns: [], summary: "" });
    setProposal(null);
    setError("");
    setStatus("Conversation cleared. Scene settings are preserved.");
  }
  async function ask(question = message) {
    if (!question.trim() || pending) return;
    const current = capture(),
      controller = new AbortController(),
      token = ++generation.current;
    requestRef.current = controller;
    lastQuestion.current = question;
    setPending(true);
    setError("");
    setProposal(null);
    setApplied(false);
    setStatus("Reading your current scene…");
    setMessage("");
    const next = appendTurn(memory, {
      role: "user",
      text: question,
      sceneId: binding.sceneId,
    });
    setMemory(next);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          version: 1,
          requestId: crypto.randomUUID(),
          kind: binding.kind,
          lessonId: binding.lessonId,
          sceneId: binding.sceneId,
          level: binding.level,
          ...current,
          message: question,
          history: memory.turns.slice(-8),
          summary: memory.summary,
        }),
      });
      const answer = await readTutorStream(response, (s) => {
        if (token === generation.current) setStatus(s);
      });
      if (token !== generation.current) return;
      if (
        answer.lessonId !== binding.lessonId ||
        answer.sceneId !== binding.sceneId ||
        answer.revision !== current.revision
      )
        throw new Error("This answer belongs to a different scene context.");
      setProposal(answer);
      setMemory(
        appendTurn(next, {
          role: "assistant",
          sceneId: binding.sceneId,
          text: [
            answer.reply.explanation,
            answer.reply.actions.length
              ? "Proposed computed comparison:"
              : "Current computed results:",
            answer.resultText,
          ]
            .join("\n")
            .slice(0, 5000),
        }),
      );
      setStatus(
        "Answer validated. Proposed changes wait for you to apply them.",
      );
    } catch (e) {
      if (token === generation.current && !controller.signal.aborted) {
        setError(e instanceof Error ? e.message : "The tutor is unavailable.");
        setStatus("No changes were made.");
      }
    } finally {
      if (token === generation.current) {
        setPending(false);
        requestRef.current = null;
      }
    }
  }
  const stale = !!proposal && proposal.revision !== revision && !applied;
  function accept() {
    if (!proposal) return;
    const result = apply(proposal);
    setStatus(result.feedback);
    if (result.ok) {
      setApplied(true);
      setMemory((m) =>
        appendTurn(m, {
          role: "assistant",
          sceneId: binding.sceneId,
          text: result.feedback.slice(0, 5000),
        }),
      );
    }
  }
  const questions = proposal?.reply.suggestions.length
    ? proposal.reply.suggestions
    : suggestions;
  return (
    <details className="tutor-panel" open data-tutor-scene={binding.sceneId}>
      <summary>
        Ask about {readOnly ? "this paper" : "this scene"} <span>AI tutor</span>
      </summary>
      <p className="tutor-intro">
        {readOnly
          ? "Answers use this paper’s extracted evidence. This view does not control a simulation."
          : "Ask why, try a different assumption, or explore the selected element. Changes are computed locally."}
      </p>
      {memory.turns.length > 0 && (
        <div className="tutor-transcript" aria-label="Conversation history">
          {memory.turns.slice(-8).map((turn, i) => (
            <article
              key={`${i}:${turn.text.slice(0, 20)}`}
              className={`tutor-turn ${turn.role}`}
            >
              <span className="eyebrow">
                {turn.role === "user" ? "Your question" : "Tutor"}
              </span>
              <p>{turn.text}</p>
            </article>
          ))}
        </div>
      )}
      {proposal && (
        <div className="tutor-answer" aria-label="Validated tutor answer">
          {proposal.reply.clarification && (
            <p>{proposal.reply.clarification}</p>
          )}
          <details className="tutor-results" open>
            <summary>
              {proposal.reply.actions.length
                ? "Calculated before / after"
                : "Current calculated state"}
            </summary>
            <pre>{proposal.resultText}</pre>
          </details>
          {proposal.reply.actions.length > 0 && (
            <>
              <ul className="tutor-action-list">
                {proposal.reply.actions.map((a, i) => (
                  <li key={i}>
                    {a.type.replaceAll("_", " ")}
                    {"key" in a.payload
                      ? ` · ${a.payload.key} = ${a.payload.value}`
                      : "sceneId" in a.payload
                        ? ` · ${a.payload.sceneId}`
                        : "step" in a.payload
                          ? ` · ${a.payload.step}`
                          : "ids" in a.payload
                            ? ` · ${a.payload.ids.join(", ")}`
                            : ""}
                  </li>
                ))}
              </ul>
              <button
                className="tutor-apply"
                onClick={accept}
                disabled={applied || stale || pending}
              >
                {applied
                  ? "Changes applied"
                  : stale
                    ? "Proposal expired"
                    : "Apply to scene"}
              </button>
            </>
          )}
          {onAnimation &&
            !readOnly &&
            !stale &&
            (!proposal.reply.actions.length || applied) && (
              <button
                className="tutor-replay"
                onClick={() => onAnimation(proposal)}
              >
                Watch this explanation
              </button>
            )}
          {stale && (
            <p className="tutor-caveat">
              The scene changed. Ask again to prepare actions for its current
              state.
            </p>
          )}
          {[...proposal.reply.assumptions, ...proposal.reply.caveats].map(
            (text, i) => (
              <p className="tutor-caveat" key={i}>
                {text}
              </p>
            ),
          )}
          {proposal.sources.length > 0 && (
            <details className="tutor-sources">
              <summary>Sources · {proposal.sources.length}</summary>
              {proposal.sources.map((s) => (
                <div key={s.id}>
                  <a
                    href={s.url}
                    target={
                      s.url?.startsWith("https://") ? "_blank" : undefined
                    }
                    rel="noreferrer"
                  >
                    {s.title}
                  </a>
                  {s.quote && <blockquote>{s.quote}</blockquote>}
                </div>
              ))}
            </details>
          )}
          <small className="tutor-usage">
            {proposal.usage.model} ·{" "}
            {proposal.usage.inputTokens + proposal.usage.outputTokens} tokens
            {proposal.usage.estimatedUsd !== null
              ? ` · estimated $${proposal.usage.estimatedUsd.toFixed(4)}`
              : ""}
          </small>
        </div>
      )}
      <div className="tutor-suggestions" aria-label="Suggested questions">
        {questions.map((q) => (
          <button key={q} disabled={pending} onClick={() => setMessage(q)}>
            {q}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <label htmlFor={`${uid}-question`}>Your question</label>
        <textarea
          id={`${uid}-question`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1200}
          rows={3}
          placeholder="What changes if…"
          disabled={!ready}
        />
        <div className="tutor-composer-actions">
          <button type="submit" disabled={pending || !message.trim() || !ready}>
            Ask tutor
          </button>
          {pending && (
            <button type="button" onClick={stop}>
              Stop response
            </button>
          )}
          <button
            type="button"
            onClick={clear}
            disabled={!memory.turns.length && !pending}
          >
            Clear conversation
          </button>
        </div>
      </form>
      <p role="status" className="tutor-status">
        {pending ? "Working · " : ""}
        {status}
      </p>
      {error && (
        <div role="alert" className="tutor-error">
          <p>{error}</p>
          <button
            disabled={pending}
            onClick={() => void ask(lastQuestion.current)}
          >
            Retry question
          </button>
        </div>
      )}
      <small className="tutor-disclosure">
        AI explanations can be mistaken. This conversation stays in this
        browser; asking sends the current context to the configured model.
      </small>
    </details>
  );
}
