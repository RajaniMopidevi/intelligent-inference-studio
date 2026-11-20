import { createFileRoute } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { PageHeader } from "@/components/mars/Shell";
import { InfoCard } from "@/components/mars/Section";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Project — Mars Terrain Intelligence" },
      { name: "description", content: "Objective, dataset, methodology, results, limitations and tech stack of this AI4Mars segmentation project." },
      { property: "og:title", content: "About — Mars Terrain Intelligence" },
      { property: "og:description", content: "An independent AI4Mars terrain segmentation project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

const GITHUB = "https://github.com/RajaniMopidevi";

function About() {
  return (
    <>
      <PageHeader kicker="Mission brief" title="About the Project">
        <p>An independent implementation using the public AI4Mars dataset. This is not an official NASA or JPL production system.</p>
        <a href={GITHUB} target="_blank" rel="noreferrer" className="glass mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:text-primary">
          <Github className="h-4 w-4" /> github.com/RajaniMopidevi
        </a>
      </PageHeader>
      <div className="mx-auto grid max-w-7xl gap-5 px-5 md:grid-cols-2 lg:grid-cols-3">
        <InfoCard n="Objective" title="Project objective">
          <p>Train and serve a pixel-level classifier that labels Martian terrain as soil, bedrock, sand or big rock, with honest validation metrics and live inference in a web app.</p>
        </InfoCard>
        <InfoCard n="Problem" title="Problem statement">
          <p>Rovers drive slowly because operators judge every metre of terrain by eye. Automatic segmentation of sand traps, bedrock and hazardous rocks can support safer, faster route planning.</p>
        </InfoCard>
        <InfoCard n="Dataset" title="Dataset overview">
          <p>NASA AI4Mars: ~35k crowd-labelled images from Curiosity, Opportunity and Spirit. Validation used 1,607 images; unlabelled pixels (255) are ignored.</p>
        </InfoCard>
        <InfoCard n="Model" title="Model architecture">
          <p>DeepLabV3+ with an ImageNet-pretrained ResNet-50 encoder, 512×512 input, 4 output classes.</p>
        </InfoCard>
        <InfoCard n="Training" title="Training methodology">
          <p>Weighted cross-entropy (ignore index 255), AdamW optimizer, resumable checkpoints, evaluated on a held-out validation split. Final checkpoint: baseline step 622.</p>
        </InfoCard>
        <InfoCard n="Metrics" title="Evaluation & results">
          <p>Mean IoU 74.64% · pixel accuracy 94.16%. Soil 89.29%, Bedrock 90.90%, Sand 85.12%, Big Rock 33.25% IoU.</p>
        </InfoCard>
        <InfoCard n="Limitations" title="Know the boundaries">
          <ul className="list-disc space-y-1 pl-5"><li>Big Rock is weak — class imbalance and confusion with bedrock.</li><li>Built for AI4Mars-style rover imagery; unrelated photos give unreliable output.</li><li>Uploads have no ground truth, so their accuracy can't be measured.</li></ul>
        </InfoCard>
        <InfoCard n="Stack" title="Technology stack">
          <ul className="list-disc space-y-1 pl-5"><li>Model: PyTorch, segmentation-models-pytorch</li><li>API: FastAPI + Uvicorn</li><li>Web: React, TanStack Start, Tailwind CSS, Recharts</li></ul>
        </InfoCard>
        <InfoCard n="Future" title="Next improvements">
          <ul className="list-disc space-y-1 pl-5"><li>Focal / Lovász loss or copy-paste augmentation for rare rocks.</li><li>Higher-resolution or tiled inference.</li><li>Test-time augmentation and uncertainty maps.</li></ul>
        </InfoCard>
      </div>
    </>
  );
}
