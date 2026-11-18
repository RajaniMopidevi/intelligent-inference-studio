import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/mars/Shell";
import { InfoCard } from "@/components/mars/Section";

export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      { title: "Model Lab — Mars Terrain Intelligence" },
      { name: "description", content: "Dataset, preprocessing, DeepLabV3+ architecture, loss, optimizer and the Big Rock oversampling experiment." },
      { property: "og:title", content: "Model Lab — Mars Terrain Intelligence" },
      { property: "og:description", content: "How the AI4Mars DeepLabV3+ ResNet-50 model was built." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Lab,
});

const PIPE = ["Rover image", "RGB · 512×512", "ImageNet norm", "ResNet-50 encoder", "ASPP", "Decoder", "4-class mask"];

function Lab() {
  return (
    <>
      <PageHeader kicker="Under the hood" title="Model Lab">How the terrain model was built and why the final checkpoint was chosen.</PageHeader>
      <div className="mx-auto max-w-7xl px-5">
        <div className="glass mb-8 flex flex-wrap items-center gap-2 p-5 font-mono text-xs">
          {PIPE.map((p, i) => (
            <span key={p} className="flex items-center gap-2">
              <span className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-primary">{p}</span>
              {i < PIPE.length - 1 && <span className="text-accent">→</span>}
            </span>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <InfoCard n="01" title="AI4Mars dataset">
            <p>~35k images from Curiosity, Opportunity and Spirit, labelled by citizen scientists with terrain classes. Pixels that are unlabelled or beyond rover range are excluded from the loss and the metrics.</p>
          </InfoCard>
          <InfoCard n="02" title="Preprocessing & masks">
            <p>Images are converted to RGB, resized to 512×512 and normalised with ImageNet mean/std. Masks are resized with nearest-neighbour so labels stay discrete, and the "no label" value is mapped to an ignore index.</p>
          </InfoCard>
          <InfoCard n="03" title="DeepLabV3+">
            <p>Atrous Spatial Pyramid Pooling captures context at several scales; a light decoder fuses it with low-level features to recover sharp terrain boundaries.</p>
          </InfoCard>
          <InfoCard n="04" title="ResNet-50 encoder">
            <p>An ImageNet-pretrained ResNet-50 extracts features; transfer learning makes the most of grayscale rover imagery.</p>
          </InfoCard>
          <InfoCard n="05" title="Four terrain classes">
            <p>Soil, Bedrock, Sand and Big Rock — the categories that matter for rover traversability.</p>
          </InfoCard>
          <InfoCard n="06" title="Weighted cross-entropy">
            <p>Class weights raise the cost of mistakes on rarer classes so the model doesn't simply predict soil everywhere.</p>
          </InfoCard>
          <InfoCard n="07" title="AdamW optimizer">
            <p>Adam with decoupled weight decay gives stable fine-tuning of the pretrained encoder and regularises the decoder.</p>
          </InfoCard>
          <InfoCard n="08" title="Training & validation">
            <p>Trained on the training split with periodic, resumable checkpoints; evaluated on a held-out validation split with mean IoU and pixel accuracy. The final model is the baseline checkpoint at step 622.</p>
          </InfoCard>
          <InfoCard n="09" title="Class imbalance & Big Rock oversampling">
            <p>Big Rock covers a tiny fraction of pixels (IoU 0.33). An experiment oversampled images containing big rocks to give the model more examples.</p>
            <p><b className="text-foreground">Why it wasn't chosen:</b> it did not beat the baseline overall on validation, so the baseline checkpoint remains the final model. Only the baseline's metrics are reported here.</p>
          </InfoCard>
        </div>
      </div>
    </>
  );
}
