"use client";

import { BoxType } from "@/lib/api";

interface BoxTypeSelectProps {
  boxTypes: BoxType[];
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  inline?: boolean;
  compact?: boolean;
}

export default function BoxTypeSelect({
  boxTypes,
  value,
  onChange,
  loading,
  inline = false,
  compact = false,
}: BoxTypeSelectProps) {
  const content = (
    <>
      <label
        htmlFor="box-type"
        className={`block font-semibold text-slate-500 uppercase tracking-wide ${
          compact ? "text-xs mb-1" : "text-sm mb-2"
        }`}
      >
        Box Type
      </label>
      <select
        id="box-type"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className={`w-full rounded-lg border-2 border-slate-300 bg-white px-3 font-medium text-slate-800 appearance-none focus:outline-none focus:border-blue-500 disabled:opacity-50 ${
          compact
            ? "py-2 text-base min-h-[44px]"
            : "py-3 text-lg min-h-[48px] px-4 rounded-xl"
        }`}
      >
        <option value="">Select box type...</option>
        {boxTypes.map((bt) => (
          <option key={bt.id} value={bt.name}>
            {bt.name}
          </option>
        ))}
      </select>
    </>
  );

  if (inline) return <div>{content}</div>;

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm">
      {content}
    </div>
  );
}
