import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanLine, ArrowRight } from "lucide-react";
import { METRICS } from "@/lib/mission-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MARS // Terrain Intelligence — AI4Mars Segmentation" },
      { name: "description", content: "Explore the Martian surface, one pixel at a time. DeepLabV3+ terrain segmentation on AI4Mars rover imagery." },
      { property: "og:title", content: "MARS // Terrain Intelligence" },
      { property: "og:description", content: "Upload rover imagery and segment soil, bedrock, sand and big rocks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const STATS = [
  { v: "4", l: "Terrain classes" },
  { v: `${(METRICS.meanIoU * 100).toFixed(2)}%`, l: "Validation mIoU" },
  { v: `${(METRICS.pixelAccuracy * 100).toFixed(2)}%`, l: "Validation pixel accuracy" },
  { v: "DeepLabV3+", l: "ResNet-50 encoder" },
];

function Home() {
  return (
    <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pt-16 md:grid-cols-[1.1fr_1fr] md:pt-24">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">Mission Control · Sol Ops</p>
        <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
          MARS <span className="text-accent">//</span><br />TERRAIN INTELLIGENCE
        </h1>
        <p className="mt-5 text-lg text-foreground/90">Explore the Martian surface, one pixel at a time.</p>
        <p className="mt-4 max-w-xl text-muted-foreground">
          A semantic segmentation model trained on NASA's AI4Mars dataset labels every pixel of rover imagery as
          soil, bedrock, sand or big rock — the terrain knowledge a rover needs to plan safe drives.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/scanner" className="bg-cta inline-flex items-center gap-2 rounded-lg px-6 py-3 font-display text-sm font-bold tracking-widest text-primary-foreground shadow-lg transition hover:scale-[1.03]">
            <ScanLine className="h-4 w-4" /> INITIATE TERRAIN SCAN
          </Link>
          <Link to="/lab" className="glass inline-flex items-center gap-2 px-6 py-3 text-sm hover:text-primary">
            How it works <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-md">
        <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-primary/30" />
        <div className="absolute inset-8 animate-spin-slow rounded-full border border-violet/30" style={{ animationDirection: "reverse", animationDuration: "60s" }}>
          <span className="absolute -top-1.5 left-1/2 h-3 w-3 rounded-full bg-primary glow" />
        </div>
        <div className="mars-planet animate-float absolute inset-16" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.l} className="glass p-5">
            <div className="font-display text-2xl font-bold text-primary md:text-3xl">{s.v}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
