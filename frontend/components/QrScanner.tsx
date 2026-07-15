"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { RefreshCw, QrCode } from "lucide-react";
import { parseLotCaseNumber, BoxType, isSecureCameraContext } from "@/lib/api";
import BoxTypeSelect from "@/components/BoxTypeSelect";

interface QrScannerProps {
  lotNo: string;
  onLotNoChange: (lotNo: string) => void;
  caseNo: string;
  onCaseNoChange: (caseNo: string) => void;
  boxTypes: BoxType[];
  boxType: string;
  onBoxTypeChange: (value: string) => void;
  boxTypesLoading?: boolean;
}

async function pickCameraId(): Promise<string | { facingMode: string }> {
  try {
    const cameras = await Html5Qrcode.getCameras();
    if (!cameras.length) return { facingMode: "environment" };

    const back = cameras.find(
      (c) =>
        /back|rear|environment|หลัง/i.test(c.label) &&
        !/front|user|selfie/i.test(c.label)
    );
    if (back) return back.id;

    return cameras[cameras.length - 1].id;
  } catch {
    return { facingMode: "environment" };
  }
}

function isIgnorableScannerError(err: unknown): boolean {
  if (!(err instanceof Error)) return true;
  return (
    err.name === "AbortError" ||
    err.message.includes("interrupted") ||
    err.message.includes("already under transition") ||
    err.message.includes("not running")
  );
}

export default function QrScanner({
  lotNo,
  onLotNoChange,
  caseNo,
  onCaseNoChange,
  boxTypes,
  boxType,
  onBoxTypeChange,
  boxTypesLoading,
}: QrScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const containerId = "qr-reader";

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (!scanner) {
      if (mountedRef.current) setScanning(false);
      return;
    }

    try {
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        await scanner.stop();
      }
    } catch (err) {
      if (!isIgnorableScannerError(err)) {
        console.warn("QR scanner stop:", err);
      }
    }

    await new Promise((r) => setTimeout(r, 50));

    try {
      scanner.clear();
    } catch {
      // ignore clear errors
    }

    if (mountedRef.current) setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (busyRef.current) return;

    if (!isSecureCameraContext()) {
      setError("ต้องใช้ HTTPS — เปิดผ่าน cloudflared/ngrok URL");
      return;
    }

    busyRef.current = true;
    setError(null);

    try {
      await stopScanner();

      const scanner = new Html5Qrcode(containerId, { verbose: false });
      scannerRef.current = scanner;
      const cameraId = await pickCameraId();

      await scanner.start(
        cameraId,
        {
          fps: 8,
          qrbox: (viewfinderWidth, viewfinderHeight) => ({
            width: Math.floor(viewfinderWidth * 0.85),
            height: Math.floor(viewfinderHeight * 0.85),
          }),
          aspectRatio: 1,
        },
        (decodedText) => {
          const parsed = parseLotCaseNumber(decodedText);
          if (!parsed) {
            setError("QR ต้องเป็นตัวเลข 9 หลัก");
            return;
          }
          onLotNoChange(parsed.lotNo);
          onCaseNoChange(parsed.caseNo);
          void stopScanner();
        },
        () => {}
      );

      if (mountedRef.current) setScanning(true);
    } catch (err) {
      if (!isIgnorableScannerError(err)) {
        const msg =
          err instanceof Error ? err.message : "Camera access denied or unavailable";
        setError(
          msg.includes("NotAllowed")
            ? "กรุณาอนุญาตกล้องใน Settings > Safari"
            : "เปิดกล้องไม่ได้ — ลองพิมพ์ Lot No ด้านล่าง"
        );
        console.error(err);
      }
      await stopScanner();
    } finally {
      busyRef.current = false;
    }
  }, [onCaseNoChange, onLotNoChange, stopScanner]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void stopScanner();
    };
  }, [stopScanner]);

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex gap-3 items-center">
        <button
          type="button"
          onClick={() => void startScanner()}
          className="relative w-[9.5rem] aspect-square shrink-0 rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 active:bg-slate-200"
          aria-label="Open camera to scan QR code"
        >
          <div id={containerId} className="qr-viewport absolute inset-0 pointer-events-none" />
          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-100/90 z-10">
              <QrCode className="w-10 h-10 text-slate-400" />
              <span className="text-xs font-medium text-slate-500 px-2 text-center leading-tight">
                {error ? "แตะเพื่อลองใหม่" : "แตะเพื่อสแกน QR"}
              </span>
            </div>
          )}
        </button>

        <div className="flex-1 flex flex-col gap-2 min-w-0 justify-center">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Lot No
              </span>
              <button
                type="button"
                onClick={() => void startScanner()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold active:bg-blue-100 shrink-0"
                aria-label="Re-scan QR code"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Re-scan
              </button>
            </div>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={10}
              value={caseNo ? `${lotNo}-${caseNo}` : lotNo}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                onLotNoChange(digits.slice(0, 6));
                onCaseNoChange(digits.slice(6));
                setError(
                  digits.length > 0 && digits.length < 9
                    ? "กรุณากรอกตัวเลขให้ครบ 9 หลัก"
                    : null
                );
              }}
              placeholder="ตัวเลข 9 หลัก"
              className="w-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-2 min-h-[44px] text-xl font-bold text-slate-800 placeholder:text-base placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:border-solid"
            />
          </div>

          <BoxTypeSelect
            boxTypes={boxTypes}
            value={boxType}
            onChange={onBoxTypeChange}
            loading={boxTypesLoading}
            inline
            compact
          />

          {error && (
            <p className="text-xs text-red-500 leading-tight">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
