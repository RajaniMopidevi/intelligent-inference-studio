import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/mars/Shell";
import { InfoCard } from "@/components/mars/Section";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Project — Mars Terrain Intelligence" },
      { name: "description", content: "Motivation, objectives, methodology, limitations and future work of this AI4Mars segmentation project." },
      { property: "og:title", content: "About — Mars Terrain Intelligence" },
      { property: "og:description", content: "An independent AI4Mars terrain segmentation project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      <PageHeader kicker="Mission brief" title="About the Project">
        An independent implementation using the public AI4Mars dataset. This is not an official NASA or JPL production system.
      </PageHeader>
      <div className="mx-auto grid max-w-7xl gap-5 px-5 md:grid-cols-2">
        <InfoCard n="Motivation" title="Why terrain matters">
          <p>Rovers drive slowly because operators must judge every metre of terrain. Automatic segmentation of sand traps, bedrock and hazardous rocks can support safer, faster route planning.</p>
        </InfoCard>
        <InfoCard n="Objectives" title="What it set out to do">
          <ul className="list-disc space-y-1 pl-5"><li>Train a pixel-level classifier for four terrain types.</li><li>Report honest validation metrics.</li><li>Serve real inference through an interactive web app.</li></ul>
        </InfoCard>
        <InfoCard n="Methodology" title="How">
          <p>DeepLabV3+ with a pretrained ResNet-50 encoder, 512×512 ImageNet-normalised inputs, weighted cross-entropy and AdamW, evaluated by mIoU and pixel accuracy on a held-out split.</p>
        </InfoCard>
        <InfoCard n="Limitations" title="Know the boundaries">
          <ul className="list-disc space-y-1 pl-5"><li>Big Rock remains weak (IoU 0.33).</li><li>Designed for AI4Mars-style rover imagery; unrelated photos give unreliable output.</li><li>Uploads have no ground truth, so their accuracy can't be measured.</li></ul>
        </InfoCard>
        <InfoCard n="Future" title="Next improvements">
          <ul className="list-disc space-y-1 pl-5"><li>Focal / Lovász loss or copy-paste augmentation for rare rocks.</li><li>Higher-resolution or tiled inference.</li><li>Test-time augmentation and uncertainty maps.</li></ul>
        </InfoCard>
      </div>
    </>
  );
}
