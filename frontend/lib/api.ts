function getApiBase(): string {
  // Same-origin /api/* is proxied by Next.js — works on iPhone over HTTPS
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  return "";
}

const API_BASE = getApiBase();

export type InspectionResult = "LOCK" | "UNLOCK";
export type OverallResult = "PASS" | "FAIL";

export interface BoxType {
  id: number;
  name: string;
}

export interface PredictResponse {
  result: InspectionResult;
  path: string;
}

export interface ImageEntry {
  path: string;
  result: InspectionResult;
  previewUrl?: string;
}

export interface SubmitResponse {
  id: string;
  lot_no: string;
  box_type: string;
  overall_result: OverallResult;
  created_at: string;
}

export async function fetchBoxTypes(): Promise<BoxType[]> {
  const res = await fetch(`${API_BASE}/api/box-types`);
  if (!res.ok) throw new Error("Failed to fetch box types");
  return res.json();
}

export async function predictImage(file: File): Promise<PredictResponse> {
  const form = new FormData();
  form.append("image", file);

  const res = await fetch(`${API_BASE}/api/inspection/predict`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Prediction failed");
  }

  return res.json();
}

export async function submitInspection(data: {
  lot_no: string;
  box_type: string;
  images: ImageEntry[];
}): Promise<SubmitResponse> {
  const res = await fetch(`${API_BASE}/api/inspection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lot_no: data.lot_no,
      box_type: data.box_type,
      images: data.images.map(({ path, result }) => ({ path, result })),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to submit inspection");
  }

  return res.json();
}

export function parseLotNumber(qrText: string): string {
  const trimmed = qrText.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.lot_no) return String(parsed.lot_no);
    if (parsed.lotNo) return String(parsed.lotNo);
  } catch {
    // not JSON — use raw text
  }
  return trimmed;
}

export function isSecureCameraContext(): boolean {
  if (typeof window === "undefined") return true;
  return window.isSecureContext;
}
