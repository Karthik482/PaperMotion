export function ExplanationSwitch({
  value,
  onChange,
}: {
  value: "beginner" | "technical";
  onChange: (value: "beginner" | "technical") => void;
}) {
  return (
    <div
      className="explanation-switch"
      role="group"
      aria-label="Explanation level"
    >
      {(["beginner", "technical"] as const).map((level) => (
        <button
          key={level}
          aria-pressed={value === level}
          onClick={() => onChange(level)}
        >
          {level === "beginner" ? "Beginner" : "Technical"}
        </button>
      ))}
    </div>
  );
}
