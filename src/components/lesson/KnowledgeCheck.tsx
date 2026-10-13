import { useState } from "react";
import type { LessonModule } from "@/types/lesson";
export function KnowledgeCheck({
  module,
  onCorrect,
}: {
  module: LessonModule;
  onCorrect: () => void;
}) {
  const [answer, setAnswer] = useState<number | null>(null);
  return (
    <section className="knowledge">
      <span className="eyebrow">A QUICK CHECK</span>
      <h3>{module.question}</h3>
      <div className="answer-options">
        {module.options.map((o, i) => (
          <button
            aria-pressed={answer === i}
            key={o}
            onClick={() => {
              setAnswer(i);
              if (i === module.answer) onCorrect();
            }}
            className={
              answer === i
                ? i === module.answer
                  ? "correct"
                  : "incorrect"
                : ""
            }
          >
            <span>{String.fromCharCode(65 + i)}</span>
            {o}
          </button>
        ))}
      </div>
      {answer !== null && (
        <p
          role="status"
          className={
            answer === module.answer ? "feedback correct-text" : "feedback"
          }
        >
          {answer === module.answer ? "✓ Exactly. " : "Try again. "}
          {answer === module.answer
            ? module.feedback
            : "Revisit the explanation above and choose another answer."}
        </p>
      )}
    </section>
  );
}
