"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Brand } from "@/components/layout/Brand";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
export function PaperShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <div className={`research-shell ${className}`}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="research-nav">
        <Brand />

        <nav aria-label="Research navigation">
          <Link
            href="/"
            aria-current={
              pathname === "/" || pathname.startsWith("/learn/")
                ? "page"
                : undefined
            }
          >
            Explore topics
          </Link>
          <Link
            href="/papers"
            aria-current={pathname.startsWith("/papers") ? "page" : undefined}
          >
            Paper library
          </Link>
          <Link href="/lessons/transformer">Transformer lab</Link>
        </nav>
        <ThemeToggle />
      </header>
      <main id="main-content" className="research-content">
        {children}
      </main>
      <footer className="research-footer">
        PaperMotion <span>A working notebook for difficult ideas.</span>
      </footer>
    </div>
  );
}
