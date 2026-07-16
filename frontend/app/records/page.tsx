"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import {
  fetchInspections,
  getImageUrl,
  InspectionRecord,
  InspectionResult,
} from "@/lib/api";
import ImageViewerModal from "@/components/ImageViewerModal";

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function AngleBadge({
  result,
  onClick,
}: {
  result: InspectionResult;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold border-2 ${
        result === "LOCK"
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-red-50 text-red-700 border-red-200"
      }`}
    >
      {result}
    </button>
  );
}

export default function RecordsPage() {
  const [lotNoInput, setLotNoInput] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [caseNoInput, setCaseNoInput] = useState("");
  const [caseNo, setCaseNo] = useState("");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const load = useCallback(() => {
    fetchInspections({ lotNo, caseNo, page, pageSize: PAGE_SIZE })
      .then((res) => {
        setRecords(res.data);
        setTotal(res.total);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
    // reloadToken forces a refetch even when lotNo/caseNo/page are unchanged
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotNo, caseNo, page, reloadToken]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setPage(1);
    setLotNo(lotNoInput.trim());
    setCaseNo(caseNoInput.trim());
    setReloadToken((t) => t + 1);
  }

  function goToPage(next: number) {
    setLoading(true);
    setPage(next);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const angleColumns: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];

  return (
    <main className="mx-auto w-full max-w-5xl min-h-screen flex flex-col px-4 pt-[env(safe-area-inset-top)] pb-4 bg-slate-100">
      <div className="flex flex-col gap-4 flex-1 pt-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border-2 border-slate-200 bg-white shadow-sm"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="text-xl font-bold text-slate-800">Records</h1>
        </div>

        <form
          onSubmit={handleSearch}
          className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm flex gap-2"
        >
          <input
            type="text"
            inputMode="numeric"
            placeholder="ค้นหา Lot No..."
            value={lotNoInput}
            onChange={(e) => setLotNoInput(e.target.value)}
            className="flex-1 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-lg min-h-[48px] focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="ค้นหา Case No..."
            value={caseNoInput}
            onChange={(e) => setCaseNoInput(e.target.value)}
            className="flex-1 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-lg min-h-[48px] focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 text-white font-bold px-4 min-h-[48px] active:bg-slate-900"
          >
            <Search className="w-5 h-5" />
          </button>
        </form>

        {error && (
          <p className="text-center text-red-600 font-medium">{error}</p>
        )}

        <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-sm overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading...
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              ไม่พบข้อมูล
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left text-slate-500 uppercase text-xs tracking-wide">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Lot No</th>
                  <th className="px-4 py-3">Case No</th>
                  <th className="px-4 py-3">Box Type</th>
                  <th className="px-4 py-3">Angle 1</th>
                  <th className="px-4 py-3">Angle 2</th>
                  <th className="px-4 py-3">Angle 3</th>
                  <th className="px-4 py-3">Angle 4</th>
                  <th className="px-4 py-3">Overall</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {r.name}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {r.lot_no}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.case_no}</td>
                    <td className="px-4 py-3 text-slate-600">{r.box_type}</td>
                    {angleColumns.map((n) => {
                      const image = r[`image_${n}` as const];
                      const result = r[`result_${n}` as const];
                      return (
                        <td key={n} className="px-4 py-3">
                          <AngleBadge
                            result={result}
                            onClick={() => setViewerImage(getImageUrl(image))}
                          />
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border-2 ${
                          r.overall_result === "PASS"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {r.overall_result}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pb-4">
          <button
            type="button"
            onClick={() => goToPage(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            className="rounded-xl bg-slate-800 text-white font-bold px-4 py-2 min-h-[44px] active:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ก่อนหน้า
          </button>
          <span className="text-slate-600 font-medium">
            หน้า {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || loading}
            className="rounded-xl bg-slate-800 text-white font-bold px-4 py-2 min-h-[44px] active:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ถัดไป
          </button>
        </div>
      </div>

      <ImageViewerModal
        imageUrl={viewerImage}
        onClose={() => setViewerImage(null)}
      />
    </main>
  );
}
