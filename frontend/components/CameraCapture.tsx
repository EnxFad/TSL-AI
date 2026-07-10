"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, SwitchCamera, X, Loader2 } from "lucide-react";

interface CameraCaptureProps {
  open: boolean;
  angle: number;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function CameraCapture({
  open,
  angle,
  onClose,
  onCapture,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    let cancelled = false;

    async function startCamera() {
      setError(null);
      setStarting(true);
      stopCamera();

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("เบราว์เซอร์นี้ไม่รองรับกล้อง กรุณาใช้ HTTPS หรืออัปโหลดรูปแทน");
        setStarting(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "ไม่สามารถเปิดกล้องได้";
        setError(
          message.includes("Permission") || message.includes("NotAllowed")
            ? "ไม่ได้รับอนุญาตใช้กล้อง กรุณาอนุญาตในเบราว์เซอร์"
            : "เปิดกล้องไม่ได้ — ลองสลับกล้องหรือใช้อัปโหลดแทน"
        );
      } finally {
        if (!cancelled) setStarting(false);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facingMode]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function handleClose() {
    stopCamera();
    onClose();
  }

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `angle_${angle}_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        stopCamera();
        onCapture(file);
        onClose();
      },
      "image/jpeg",
      0.92
    );
  }

  function toggleFacing() {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="font-semibold">ถ่ายมุม {angle}</p>
        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-full active:bg-white/10"
          aria-label="ปิดกล้อง"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="max-h-full max-w-full object-contain"
        />

        {starting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}

        {error && (
          <div className="absolute inset-x-4 bottom-4 rounded-xl bg-red-600/90 text-white px-4 py-3 text-sm text-center">
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-10 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={toggleFacing}
          disabled={starting || !!error}
          className="w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center disabled:opacity-40"
          aria-label="สลับกล้อง"
        >
          <SwitchCamera className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={handleCapture}
          disabled={starting || !!error}
          className="w-20 h-20 rounded-full border-4 border-white bg-white/90 active:scale-95 disabled:opacity-40 flex items-center justify-center"
          aria-label="ถ่ายรูป"
        >
          <Camera className="w-8 h-8 text-slate-800" />
        </button>

        <div className="w-12 h-12" />
      </div>
    </div>
  );
}
