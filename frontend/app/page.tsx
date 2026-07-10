"use client";

import { useEffect, useState, useCallback } from "react";
import QrScanner from "@/components/QrScanner";
import AngleCapture, { AngleData } from "@/components/AngleCapture";
import SubmitBar from "@/components/SubmitBar";
import {
  fetchBoxTypes,
  submitInspection,
  BoxType,
  OverallResult,
} from "@/lib/api";

const EMPTY_ANGLE: AngleData = {
  path: "",
  result: null,
  previewUrl: null,
  processing: false,
};

function createEmptyAngles(): AngleData[] {
  return [1, 2, 3, 4].map(() => ({ ...EMPTY_ANGLE }));
}

export default function InspectionPage() {
  const [lotNo, setLotNo] = useState("");
  const [boxType, setBoxType] = useState("");
  const [boxTypes, setBoxTypes] = useState<BoxType[]>([]);
  const [boxTypesLoading, setBoxTypesLoading] = useState(true);
  const [angles, setAngles] = useState<AngleData[]>(createEmptyAngles);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<OverallResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchBoxTypes()
      .then(setBoxTypes)
      .catch(console.error)
      .finally(() => setBoxTypesLoading(false));
  }, []);

  const handleAngleUpdate = useCallback(
    (index: number, data: Partial<AngleData>) => {
      setAngles((prev) => {
        const next = [...prev];
        next[index - 1] = { ...next[index - 1], ...data };
        return next;
      });
      setSubmitResult(null);
    },
    []
  );

  const allReady =
    lotNo.trim() !== "" &&
    boxType.trim() !== "" &&
    angles.every((a) => a.path && a.result && !a.processing);

  async function handleSubmit() {
    if (!allReady) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitResult(null);

    try {
      const response = await submitInspection({
        lot_no: lotNo,
        box_type: boxType,
        images: angles.map((a) => ({
          path: a.path,
          result: a.result!,
        })),
      });
      setSubmitResult(response.overall_result);

      setLotNo("");
      setBoxType("");
      setAngles(createEmptyAngles());
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[768px] min-h-screen flex flex-col px-4 pt-[env(safe-area-inset-top)] pb-4 bg-slate-100">
      <div className="flex flex-col gap-4 flex-1 pt-4">
        <QrScanner
          lotNo={lotNo}
          onLotNoChange={setLotNo}
          boxTypes={boxTypes}
          boxType={boxType}
          onBoxTypeChange={setBoxType}
          boxTypesLoading={boxTypesLoading}
        />

        <div className="grid grid-cols-2 gap-3">
          {angles.map((angleData, i) => (
            <AngleCapture
              key={i}
              angle={i + 1}
              data={angleData}
              onUpdate={handleAngleUpdate}
            />
          ))}
        </div>

        {submitError && (
          <p className="text-center text-red-600 font-medium">{submitError}</p>
        )}

        <SubmitBar
          onSubmit={handleSubmit}
          submitting={submitting}
          submitResult={submitResult}
          disabled={!allReady}
        />
      </div>
    </main>
  );
}
