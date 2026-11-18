import type { ReactNode } from "react";
export function InfoCard({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <article className="glass p-6 transition hover:border-primary/50">
      <p className="font-mono text-xs text-accent">{n}</p>
      <h2 className="mt-2 text-base tracking-wider">{title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </article>
  );
}
