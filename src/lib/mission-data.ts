// Reported results of the baseline checkpoint (mars_resume_20261114T163234Z_step_00000622.pth).
export const CLASSES = [
  { key: "soil", label: "Soil", id: 0, iou: 0.8929, color: "var(--soil)", rgb: [214, 118, 62] },
  { key: "bedrock", label: "Bedrock", id: 1, iou: 0.909, color: "var(--bedrock)", rgb: [110, 160, 220] },
  { key: "sand", label: "Sand", id: 2, iou: 0.8512, color: "var(--sand)", rgb: [235, 205, 90] },
  { key: "big_rock", label: "Big Rock", id: 3, iou: 0.3325, color: "var(--bigrock)", rgb: [220, 60, 150] },
] as const;

export type ClassKey = (typeof CLASSES)[number]["key"];

export const METRICS = {
  meanIoU: 0.7464,
  pixelAccuracy: 0.941623,
  architecture: "DeepLabV3+",
  encoder: "ResNet-50",
  checkpoint: "mars_resume_20261114T163234Z_step_00000622.pth",
  inputSize: 512,
};
