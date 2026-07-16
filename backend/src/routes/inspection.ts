import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { upload } from "../middleware/upload.js";
import { predictImage } from "../services/aiClient.js";
import { saveUploadedFile } from "../services/storage.js";

const router = Router();
const prisma = new PrismaClient();

type InspectionResult = "LOCK" | "UNLOCK";

interface ImageEntry {
  path: string;
  result: InspectionResult;
}

function computeOverallResult(results: InspectionResult[]): "PASS" | "FAIL" {
  return results.every((r) => r === "LOCK") ? "PASS" : "FAIL";
}

router.get("/", async (req, res) => {
  const lotNo = typeof req.query.lot_no === "string" ? req.query.lot_no.trim() : "";
  const caseNo = typeof req.query.case_no === "string" ? req.query.case_no.trim() : "";
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(req.query.pageSize ?? "20"), 10) || 20)
  );

  const where = {
    ...(lotNo ? { lot_no: { contains: lotNo } } : {}),
    ...(caseNo ? { case_no: { contains: caseNo } } : {}),
  };

  try {
    const [records, total] = await Promise.all([
      prisma.boxInspection.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.boxInspection.count({ where }),
    ]);

    res.json({
      data: records.map((r) => ({
        id: r.id.toString(),
        lot_no: r.lot_no,
        case_no: r.case_no,
        box_type: r.box_type,
        image_1: r.image_1,
        result_1: r.result_1,
        image_2: r.image_2,
        result_2: r.result_2,
        image_3: r.image_3,
        result_3: r.result_3,
        image_4: r.image_4,
        result_4: r.result_4,
        overall_result: r.overall_result,
        created_at: r.created_at,
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Failed to fetch inspections:", error);
    res.status(500).json({ error: "Failed to fetch inspections" });
  }
});

router.post("/predict", upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Image file is required" });
    return;
  }

  try {
    const { result, annotated_image } = await predictImage(req.file.path);

    if (result === "NO_DETECTION") {
      res.json({
        result,
        path: "",
        annotated_image: annotated_image ?? null,
      });
      return;
    }

    const savedPath = saveUploadedFile(req.file, "angle");
    res.json({
      result,
      path: savedPath,
      annotated_image: annotated_image ?? null,
    });
  } catch (error) {
    console.error("Prediction failed:", error);
    res.status(500).json({ error: "Prediction failed" });
  }
});

router.post("/", async (req, res) => {
  const { lot_no, case_no, box_type, images } = req.body as {
    lot_no?: string;
    case_no?: string;
    box_type?: string;
    images?: ImageEntry[];
  };

  if (!/^\d{6}$/.test(lot_no?.trim() ?? "")) {
    res.status(400).json({ error: "lot_no must be exactly 6 digits" });
    return;
  }
  if (!/^\d{3}$/.test(case_no?.trim() ?? "")) {
    res.status(400).json({ error: "case_no must be exactly 3 digits" });
    return;
  }
  if (!box_type?.trim()) {
    res.status(400).json({ error: "box_type is required" });
    return;
  }
  if (!images || images.length !== 4) {
    res.status(400).json({ error: "Exactly 4 images are required" });
    return;
  }

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (!img.path?.trim()) {
      res.status(400).json({ error: `Image ${i + 1} path is required` });
      return;
    }
    if (img.result !== "LOCK" && img.result !== "UNLOCK") {
      res.status(400).json({ error: `Image ${i + 1} result must be LOCK or UNLOCK` });
      return;
    }
  }

  const results = images.map((img) => img.result);
  const overall_result = computeOverallResult(results);

  try {
    const record = await prisma.boxInspection.create({
      data: {
        lot_no: lot_no!.trim(),
        case_no: case_no!.trim(),
        box_type: box_type.trim(),
        image_1: images[0].path,
        result_1: images[0].result,
        image_2: images[1].path,
        result_2: images[1].result,
        image_3: images[2].path,
        result_3: images[2].result,
        image_4: images[3].path,
        result_4: images[3].result,
        overall_result,
      },
    });

    res.status(201).json({
      id: record.id.toString(),
      lot_no: record.lot_no,
      case_no: record.case_no,
      box_type: record.box_type,
      overall_result: record.overall_result,
      created_at: record.created_at,
    });
  } catch (error) {
    console.error("Failed to save inspection:", error);
    res.status(500).json({ error: "Failed to save inspection" });
  }
});

export default router;
