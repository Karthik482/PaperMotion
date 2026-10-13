export function ExplanationPanel({ text }: { text: string }) {
  return (
    <aside className="takeaway">
      <div>
        <strong>The idea to take away</strong>
        <p>{text}</p>
      </div>
    </aside>
  );
}
