"use client";

import { useState } from "react";
import { QrCode, ScanLine, Check, X } from "lucide-react";
import QrLiveScanner from "@/components/QrLiveScanner";

interface NameScannerProps {
  name: string;
  onNameChange: (name: string) => void;
}

export default function NameScanner({ name, onNameChange }: NameScannerProps) {
  const [scanOpen, setScanOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDetect(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("QR ไม่มีชื่อ — ลองใหม่อีกครั้ง");
      return;
    }
    setError(null);
    onNameChange(trimmed);
  }

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="relative min-h-[120px] bg-slate-50 flex items-center justify-center">
        {name ? (
          <div className="flex flex-col items-center gap-2 text-slate-700">
            <Check className="w-9 h-9 text-green-500" />
            <span className="text-lg font-bold">{name}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <QrCode className="w-10 h-10" />
            <span className="text-sm font-medium">ชื่อผู้ตรวจ</span>
          </div>
        )}
      </div>

      <div className="flex border-t-2 border-slate-200">
        <button
          type="button"
          onClick={() => setScanOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-700 bg-white active:bg-slate-50 min-h-[48px]"
        >
          <ScanLine className="w-5 h-5" />
          {name ? "สแกนใหม่" : "สแกนชื่อ"}
        </button>

        {name && (
          <button
            type="button"
            onClick={() => {
              onNameChange("");
              setError(null);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-red-500 bg-white active:bg-slate-50 min-h-[48px] border-l-2 border-slate-200"
          >
            <X className="w-5 h-5" />
            ล้าง
          </button>
        )}
      </div>

      {error && (
        <div className="px-3 py-2 border-t-2 border-slate-200 text-center">
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}

      <QrLiveScanner
        open={scanOpen}
        title="สแกน QR ชื่อผู้ตรวจ"
        hint="เล็ง QR ชื่อให้อยู่ในกรอบ ระบบจะอ่านให้เองอัตโนมัติ"
        onClose={() => setScanOpen(false)}
        onDetect={handleDetect}
      />
    </div>
  );
}
