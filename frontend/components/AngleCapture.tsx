"use client";

import { useRef, useState } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { predictImage, InspectionResult } from "@/lib/api";
import CameraCapture from "@/components/CameraCapture";

export interface AngleData {
  path: string;
  result: InspectionResult | null;
  previewUrl: string | null;
  processing: boolean;
}

interface AngleCaptureProps {
  angle: number;
  data: AngleData;
  onUpdate: (angle: number, data: Partial<AngleData>) => void;
}

function resultColor(result: InspectionResult | null, processing: boolean): string {
  if (processing) return "text-blue-500";
  if (result === "LOCK") return "text-green-600";
  if (result === "UNLOCK") return "text-red-600";
  if (result === "NO_DETECTION") return "text-yellow-500";
  return "text-slate-400";
}

function resultLabel(result: InspectionResult | null, processing: boolean): string {
  if (processing) return "Processing...";
  if (result === "NO_DETECTION") return "ไม่พบ — ถ่ายใหม่";
  return result ?? "—";
}

export default function AngleCapture({ angle, data, onUpdate }: AngleCaptureProps) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    const previewUrl = URL.createObjectURL(file);
    onUpdate(angle, {
      previewUrl,
      result: null,
      processing: true,
      path: "",
    });

    try {
      const response = await predictImage(file);
      const annotatedUrl = response.annotated_image
        ? `data:image/jpeg;base64,${response.annotated_image}`
        : previewUrl;
      if (response.annotated_image) {
        URL.revokeObjectURL(previewUrl);
      }
      onUpdate(angle, {
        path: response.path,
        result: response.result,
        previewUrl: annotatedUrl,
        processing: false,
      });
      if (response.result === "NO_DETECTION") {
        setError("ไม่พบกล่องในภาพ กรุณาถ่ายใหม่");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
      URL.revokeObjectURL(previewUrl);
      onUpdate(angle, { processing: false, previewUrl: null, result: null, path: "" });
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`rounded-2xl border-2 bg-white overflow-hidden shadow-sm ${
          data.result === "LOCK"
            ? "border-green-500"
            : data.result === "UNLOCK"
              ? "border-red-500"
              : data.result === "NO_DETECTION"
                ? "border-yellow-400"
                : "border-slate-200"
        }`}
      >
        <div className="relative min-h-[180px] bg-slate-50 flex items-center justify-center">
          {data.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.previewUrl}
              alt={`Angle ${angle}`}
              className="w-full h-[180px] object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Camera className="w-10 h-10" />
              <span className="text-sm font-medium">Angle {angle}</span>
            </div>
          )}

          {data.processing && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}
        </div>

        <div className="flex border-t-2 border-slate-200">
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            disabled={data.processing}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-700 bg-white active:bg-slate-50 min-h-[48px] disabled:opacity-50 border-r border-slate-200"
          >
            <Camera className="w-5 h-5" />
            Camera
          </button>
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            disabled={data.processing}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-700 bg-white active:bg-slate-50 min-h-[48px] disabled:opacity-50"
          >
            <Upload className="w-5 h-5" />
            Upload
          </button>
        </div>

        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      <div
        className={`text-center text-xl font-bold py-1 ${resultColor(data.result, data.processing)}`}
      >
        {resultLabel(data.result, data.processing)}
      </div>

      {error && <p className="text-xs text-yellow-600 text-center">{error}</p>}

      <CameraCapture
        open={cameraOpen}
        title={`ถ่ายมุม ${angle}`}
        fileName={`angle_${angle}`}
        onClose={() => setCameraOpen(false)}
        onCapture={handleFile}
      />
    </div>
  );
}
