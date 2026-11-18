import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";
import { PageHeader } from "@/components/mars/Shell";
import { CLASSES, METRICS } from "@/lib/mission-data";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Terrain Analytics — Mars Terrain Intelligence" },
      { name: "description", content: "Class-wise IoU, mean IoU and pixel accuracy of the AI4Mars baseline model." },
      { property: "og:title", content: "Terrain Analytics — Mars Terrain Intelligence" },
      { property: "og:description", content: "74.64% mIoU and 94.16% pixel accuracy on validation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analytics,
});

const data = CLASSES.map((c) => ({ name: c.label, iou: +(c.iou * 100).toFixed(2), fill: `rgb(${c.rgb.join(",")})` }));

function Gauge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="glass relative flex flex-col items-center p-6">
      <div className="h-44 w-44">
        <ResponsiveContainer>
          <RadialBarChart innerRadius="78%" outerRadius="100%" data={[{ v: value * 100, fill: color }]} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="v" cornerRadius={20} background={{ fill: "oklch(0.25 0.04 265)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="absolute top-[88px] font-display text-2xl font-bold">{(value * 100).toFixed(2)}%</div>
      <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function Analytics() {
  return (
    <>
      <PageHeader kicker="Validation results · baseline checkpoint" title="Terrain Analytics">
        Measured on the AI4Mars validation split with the final baseline model ({METRICS.checkpoint}).
      </PageHeader>
      <div className="mx-auto grid max-w-7xl gap-6 px-5 md:grid-cols-[1fr_1fr_2fr]">
        <Gauge value={METRICS.meanIoU} label="Mean IoU" color="oklch(0.82 0.14 205)" />
        <Gauge value={METRICS.pixelAccuracy} label="Pixel accuracy" color="oklch(0.66 0.18 40)" />
        <div className="glass p-6">
          <h2 className="text-sm tracking-widest">CLASS-WISE IoU</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" domain={[0, 100]} stroke="oklch(0.72 0.03 250)" fontSize={11} unit="%" />
                <YAxis type="category" dataKey="name" stroke="oklch(0.72 0.03 250)" fontSize={12} width={70} />
                <Tooltip cursor={{ fill: "oklch(1 0 0 / 5%)" }} contentStyle={{ background: "oklch(0.17 0.04 265)", border: "1px solid oklch(0.82 0.14 205 / 30%)", borderRadius: 8 }} formatter={(v) => [`${v}%`, "IoU"]} />
                <Bar dataKey="iou" radius={[0, 6, 6, 0]}>{data.map((d) => <Cell key={d.name} fill={d.fill} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass p-6 md:col-span-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground"><tr><th className="py-2">Class</th><th>IoU</th><th>Notes</th></tr></thead>
              <tbody className="font-mono">
                {CLASSES.map((c) => (
                  <tr key={c.key} className="border-t border-border">
                    <td className="py-3 font-sans"><span className="mr-2 inline-block h-3 w-3 rounded-sm align-middle" style={{ background: `rgb(${c.rgb.join(",")})` }} />{c.label}</td>
                    <td>{c.iou.toFixed(4)}</td>
                    <td className="font-sans text-muted-foreground">{c.key === "big_rock" ? "Rare, small objects — hardest class; drives the mIoU down." : "Strong, well-represented class."}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="glass p-6 md:col-span-2">
          <h2 className="text-sm tracking-widest">WHAT DO THESE MEAN?</h2>
          <p className="mt-3 text-sm text-muted-foreground"><b className="text-foreground">IoU (Intersection over Union)</b> compares the area the model labelled as a class with the area that truly is that class: overlap ÷ combined area. 1.0 is a perfect match; it punishes both missed pixels and false alarms. <b className="text-foreground">Mean IoU</b> averages the four classes equally, so a weak rare class like Big Rock counts as much as Soil.</p>
          <p className="mt-3 text-sm text-muted-foreground"><b className="text-foreground">Pixel accuracy</b> is simply the share of labelled pixels classified correctly. It's high when common classes are right, which is why it sits above mIoU.</p>
        </div>
        <div className="glass p-6">
          <h2 className="text-sm tracking-widest">CONFUSION MATRIX</h2>
          <p className="mt-3 text-sm text-muted-foreground">No confusion matrix was exported with the reported results, so none is shown rather than estimating one. Export it from the evaluation script to add it here.</p>
        </div>
      </div>
    </>
  );
}
