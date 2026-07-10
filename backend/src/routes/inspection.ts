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

router.post("/predict", upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Image file is required" });
    return;
  }

  try {
    const result = await predictImage(req.file.path);
    const savedPath = saveUploadedFile(req.file, "angle");
    res.json({ result, path: savedPath });
  } catch (error) {
    console.error("Prediction failed:", error);
    res.status(500).json({ error: "Prediction failed" });
  }
});

router.post("/", async (req, res) => {
  const { lot_no, box_type, images } = req.body as {
    lot_no?: string;
    box_type?: string;
    images?: ImageEntry[];
  };

  if (!lot_no?.trim()) {
    res.status(400).json({ error: "lot_no is required" });
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
        lot_no: lot_no.trim(),
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
