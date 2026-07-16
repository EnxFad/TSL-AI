"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, SwitchCamera, X, Loader2 } from "lucide-react";

interface CameraCaptureProps {
  open: boolean;
  title: string;
  fileName: string;
  qrGuide?: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const FOCUS_SETTLE_MS = 700;

export default function CameraCapture({
  open,
  title,
  fileName,
  qrGuide = false,
  onClose,
  onCapture,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
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
      setReady(false);
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
            width: { ideal: 2560 },
            height: { ideal: 1440 },
            // @ts-expect-error advanced focus constraints aren't in the TS lib yet
            advanced: [{ focusMode: "continuous" }],
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        trackRef.current = stream.getVideoTracks()[0] ?? null;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Give autofocus/exposure a beat to settle before the shutter is
        // usable — grabbing a frame the instant the stream opens is a common
        // cause of blurry, undecodable QR photos on phone cameras.
        settleTimerRef.current = setTimeout(() => {
          if (!cancelled) setReady(true);
        }, FOCUS_SETTLE_MS);
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
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facingMode]);

  function stopCamera() {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    trackRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function handleClose() {
    stopCamera();
    onClose();
  }

  function finishCapture(blob: Blob) {
    const file = new File([blob], `${fileName}_${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
    stopCamera();
    onCapture(file);
    onClose();
  }

  function captureFromVideoFrame() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Capture the full frame — the on-screen guide (when qrGuide is set) is
    // just a visual aid for framing, not a crop boundary. Cropping tightly to
    // it risks cutting off the QR's position-detection corners whenever the
    // physical code is held larger than the guide box, which breaks decoding.
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) finishCapture(blob);
      },
      "image/jpeg",
      0.95
    );
  }

  async function handleCapture() {
    if (capturing) return;
    setCapturing(true);

    try {
      // ImageCapture.takePhoto() asks the camera hardware for an actual still
      // photo (its own focus/exposure pass, full sensor resolution) instead of
      // grabbing whatever the live preview frame happens to look like — this
      // is what makes phone QR photos decodable where a raw video-frame grab
      // often isn't. Not supported on iOS Safari, hence the fallback below.
      const ImageCaptureCtor = (
        window as unknown as {
          ImageCapture?: new (track: MediaStreamTrack) => {
            takePhoto: () => Promise<Blob>;
          };
        }
      ).ImageCapture;

      if (ImageCaptureCtor && trackRef.current) {
        const imageCapture = new ImageCaptureCtor(trackRef.current);
        const blob = await imageCapture.takePhoto();
        finishCapture(blob);
        return;
      }

      captureFromVideoFrame();
    } catch {
      captureFromVideoFrame();
    } finally {
      setCapturing(false);
    }
  }

  function toggleFacing() {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }

  if (!open) return null;

  const shutterDisabled = starting || !ready || !!error || capturing;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="font-semibold">{title}</p>
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

        {qrGuide && !starting && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <div className="w-[70vmin] max-w-[80%] aspect-square rounded-2xl border-4 border-dashed border-white/80" />
            <p className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-lg">
              จัดให้ QR อยู่ในกรอบ ใกล้และชัดที่สุด
            </p>
          </div>
        )}

        {starting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}

        {!starting && !ready && !error && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
            <p className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-lg">
              กำลังปรับโฟกัส...
            </p>
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
          onClick={() => void handleCapture()}
          disabled={shutterDisabled}
          className="w-20 h-20 rounded-full border-4 border-white bg-white/90 active:scale-95 disabled:opacity-40 flex items-center justify-center"
          aria-label="ถ่ายรูป"
        >
          {capturing ? (
            <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          ) : (
            <Camera className="w-8 h-8 text-slate-800" />
          )}
        </button>

        <div className="w-12 h-12" />
      </div>
    </div>
  );
}
