"use client";

import { PlusCircle } from "lucide-react";

interface AddBarProps {
  onAdd: () => void;
  disabled: boolean;
  count: number;
}

export default function AddBar({ onAdd, disabled, count }: AddBarProps) {
  return (
    <div className="sticky bottom-0 pb-[env(safe-area-inset-bottom)] pt-4 bg-gradient-to-t from-slate-100 via-slate-100 to-transparent">
      <p className="mb-2 text-center text-sm font-semibold text-slate-500">
        ถ่ายไปแล้ว {count} กล่อง
      </p>

      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="w-full rounded-2xl bg-slate-800 text-white text-xl font-bold py-5 min-h-[64px] active:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
      >
        <PlusCircle className="w-6 h-6" />
        Add
      </button>
    </div>
  );
}
