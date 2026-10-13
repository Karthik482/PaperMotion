import { ArrowUpRight, Check } from "lucide-react";
import { ResponsiveOutline } from "./ResponsiveOutline";
import { Brand } from "./Brand";
import { lesson } from "@/data/transformerLesson";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
export function Sidebar({
  active,
  completed,
  onSelect,
}: {
  active: number;
  completed: number[];
  onSelect: (i: number) => void;
}) {
  return (
    <aside className="sidebar">
      <Brand />
      <ThemeToggle />
      <div className="outline-context">
        <span className="eyebrow">THE INTERACTIVE EDITION</span>
        <p>Attention Is All You Need</p>
        <small>Vaswani et al. &middot; 2017</small>
      </div>
      <ResponsiveOutline label="Lesson outline" count={6}>
        <nav aria-label="Lesson modules">
          {lesson.modules.map((m, i) => (
            <button
              key={m.id}
              className={"nav-item " + (i === active ? "active" : "")}
              onClick={() => onSelect(i)}
              aria-current={i === active ? "step" : undefined}
            >
              <span className="nav-number">
                {completed.includes(i) ? (
                  <Check size={14} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              {m.title}
            </button>
          ))}
        </nav>
      </ResponsiveOutline>
      <div className="progress-box">
        <div>
          Checks completed <strong>{completed.length}/6</strong>
        </div>
        <div className="progress-track">
          <span style={{ width: `${(completed.length / 6) * 100}%` }} />
        </div>
        <small>Progress for this session</small>
      </div>
      <a
        className="paper-link"
        href="https://arxiv.org/abs/1706.03762"
        target="_blank"
        rel="noreferrer"
      >
        Original paper <ArrowUpRight size={15} />
      </a>
      <a className="paper-link" href="/papers">
        Paper library <ArrowUpRight size={15} />
      </a>
    </aside>
  );
}
