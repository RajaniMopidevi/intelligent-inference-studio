import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FolderOpen } from "lucide-react";
import { PageHeader, ClassLegend } from "@/components/mars/Shell";
import { CLASSES } from "@/lib/mission-data";

export const Route = createFileRoute("/samples")({
  head: () => ({
    meta: [
      { title: "Sample Missions — Mars Terrain Intelligence" },
      { name: "description", content: "Validation examples: rover image, ground-truth mask and model prediction." },
      { property: "og:title", content: "Sample Missions — Mars Terrain Intelligence" },
      { property: "og:description", content: "Validation examples from the AI4Mars baseline model." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Samples,
});

type Sample = { id: string; title: string; image: string; groundTruth?: string; prediction: string; overlay?: string; distribution?: Record<string, number>; description?: string };

function Samples() {
  const [samples, setSamples] = useState<Sample[] | null>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    fetch("/samples/manifest.json").then((r) => r.json()).then(setSamples).catch(() => setSamples([]));
  }, []);
  const s = samples?.[active];
  return (
    <>
      <PageHeader kicker="Validation set · pre-computed" title="Sample Missions">
        Real outputs exported from the project's evaluation run. These come from the validation set, where a ground-truth mask exists — unlike your uploads on the Scanner.
      </PageHeader>
      <div className="mx-auto max-w-7xl px-5">
        {samples === null ? <div className="glass h-64 animate-pulse" /> : samples.length === 0 ? (
          <div className="glass flex flex-col items-center p-12 text-center">
            <FolderOpen className="h-10 w-10 text-primary" />
            <h2 className="mt-4 text-sm tracking-widest">NO SAMPLE OUTPUTS LOADED YET</h2>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Sample predictions are never invented here. Export real image / ground-truth / prediction triplets from your evaluation outputs into the samples folder (see the README), and they'll appear on this page.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <div className="flex gap-2 overflow-x-auto lg:flex-col">
              {samples.map((x, i) => (
                <button key={x.id} onClick={() => setActive(i)} className={`glass shrink-0 p-2 text-left ${i === active ? "glow border-primary" : ""}`}>
                  <img src={x.image} alt={x.title} className="aspect-video w-40 rounded object-cover lg:w-full" />
                  <p className="mt-2 truncate text-xs">{x.title}</p>
                </button>
              ))}
            </div>
            {s && (
              <div className="glass p-5">
                <span className="rounded-full bg-violet/20 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-violet">Validation sample</span>
                <h2 className="mt-3 text-lg">{s.title}</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {([["Original", s.image], ["Ground truth", s.groundTruth], ["Model prediction", s.prediction], ["Overlay", s.overlay]] as const).filter(([, src]) => src).map(([l, src]) => (
                    <figure key={l}><img src={src} alt={l} className="w-full rounded-lg" /><figcaption className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{l}</figcaption></figure>
                  ))}
                </div>
                {s.description && <p className="mt-4 text-sm text-muted-foreground">{s.description}</p>}
                {s.distribution && (
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {CLASSES.map((c) => (
                      <div key={c.key} className="rounded-lg border border-border p-3">
                        <p className="text-xs text-muted-foreground">{c.label}</p>
                        <p className="font-mono text-lg">{s.distribution?.[c.key]?.toFixed(1) ?? "—"}%</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-5"><ClassLegend /></div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
