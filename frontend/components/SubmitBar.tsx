"use client";

import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { OverallResult } from "@/lib/api";

interface SubmitBarProps {
  onSubmit: () => void;
  submitting: boolean;
  submitResult: OverallResult | null;
  disabled: boolean;
}

export default function SubmitBar({
  onSubmit,
  submitting,
  submitResult,
  disabled,
}: SubmitBarProps) {
  return (
    <div className="sticky bottom-0 pb-[env(safe-area-inset-bottom)] pt-4 bg-gradient-to-t from-slate-100 via-slate-100 to-transparent">
      {submitResult && (
        <div
          className={`mb-3 rounded-2xl px-4 py-3 flex items-center justify-center gap-2 text-xl font-bold ${
            submitResult === "PASS"
              ? "bg-green-50 text-green-700 border-2 border-green-200"
              : "bg-red-50 text-red-700 border-2 border-red-200"
          }`}
        >
          {submitResult === "PASS" ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <XCircle className="w-6 h-6" />
          )}
          Overall: {submitResult}
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || submitting}
        className="w-full rounded-2xl bg-slate-800 text-white text-xl font-bold py-5 min-h-[64px] active:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
      >
        {submitting ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit"
        )}
      </button>
    </div>
  );
}
