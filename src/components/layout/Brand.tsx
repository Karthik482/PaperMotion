import Link from "next/link";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="PaperMotion home">
      <svg
        className="brand-mark"
        viewBox="0 0 28 32"
        fill="none"
        aria-hidden="true"
      >
        <path d="M3 2h15l7 7v21H3V2Z" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M18 2v8h7M7 23l5-8 5 5 5-7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      PaperMotion
    </Link>
  );
}
