"use client";

import { useRef, useState } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { predictImage, InspectionResult } from "@/lib/api";

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
  return "text-slate-400";
}

export default function AngleCapture({ angle, data, onUpdate }: AngleCaptureProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

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
      onUpdate(angle, {
        path: response.path,
        result: response.result,
        processing: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
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
      <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
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
            onClick={() => cameraRef.current?.click()}
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
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFileChange}
        />
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
        {data.processing
          ? "Processing..."
          : data.result ?? "—"}
      </div>

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
