import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./scenes.css";
import "./themes.css";
import "./refinement.css";
import "./engine.css";
import "./tutor.css";
const editorial = localFont({
  src: "./fonts/Newsreader.ttf",
  variable: "--font-editorial",
  display: "swap",
  weight: "200 800",
});
const sans = localFont({
  src: "./fonts/IBMPlexSans.ttf",
  variable: "--font-sans",
  display: "swap",
  weight: "100 700",
});
export const metadata: Metadata = {
  title: "PaperMotion - A working notebook for difficult ideas",
  description:
    "Turn your questions into learning paths. Explore topics, learn from research, and experiment with interactive lessons.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var theme=localStorage.getItem('papermotion-theme');document.documentElement.dataset.theme=theme==='dark'||theme!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}catch(e){document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}`,
          }}
        />
      </head>
      <body className={`${editorial.variable} ${sans.variable}`}>
        {children}
      </body>
    </html>
  );
}
