import { CLASSES } from "@/lib/mission-data";
import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { to: "/", label: "Mission Control" },
  { to: "/scanner", label: "Terrain Scanner" },
  { to: "/samples", label: "Sample Missions" },
  { to: "/analytics", label: "Analytics" },
  { to: "/lab", label: "Model Lab" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-sm tracking-[0.25em]">
          <span className="mars-planet inline-block h-5 w-5" /> AI4MARS
        </Link>
        <nav className="hidden gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
              className="rounded-md px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "text-primary" }}>{n.label}</Link>
          ))}
        </nav>
        <button className="md:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <nav className="flex flex-col border-t border-border px-5 py-3 md:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2 text-sm uppercase tracking-widest text-muted-foreground"
              activeProps={{ className: "text-primary" }} activeOptions={{ exact: n.to === "/" }}>{n.label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-8 text-xs text-muted-foreground">
        Independent implementation using the public AI4Mars dataset. Not an official NASA or JPL production system.
      </div>
    </footer>
  );
}

export function PageHeader({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-14 pb-8">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">{kicker}</p>
      <h1 className="mt-3 text-3xl font-bold md:text-5xl">{title}</h1>
      {children && <div className="mt-4 max-w-3xl text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ClassLegend() {
  return (
    <div className="flex flex-wrap gap-3">
      {CLASSES.map((c) => (
        <span key={c.key} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-3 w-3 rounded-sm" style={{ background: `rgb(${c.rgb.join(",")})` }} />{c.label}
        </span>
      ))}
    </div>
  );
}
