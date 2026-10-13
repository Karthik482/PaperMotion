import { ArrowUpRight } from "lucide-react";
export function LessonHeader() {
  return (
    <header className="lesson-header">
      <div>
        <span className="eyebrow">RESEARCH / DEEP LEARNING</span>
        <h1>Attention Is All You Need</h1>
      </div>
      <a
        href="https://arxiv.org/abs/1706.03762"
        target="_blank"
        rel="noreferrer"
      >
        Vaswani et al. &middot; 2017 <ArrowUpRight size={14} />
      </a>
    </header>
  );
}
