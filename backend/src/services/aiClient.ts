import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export type InspectionResult = "LOCK" | "UNLOCK";

export async function predictImage(filePath: string): Promise<InspectionResult> {
  const form = new FormData();
  form.append("image", fs.createReadStream(filePath));

  const response = await axios.post<{ result: InspectionResult }>(
    `${AI_SERVICE_URL}/predict`,
    form,
    { headers: form.getHeaders(), timeout: 30000 }
  );

  return response.data.result;
}

export async function predictImageBuffer(
  buffer: Buffer,
  filename: string
): Promise<InspectionResult> {
  const form = new FormData();
  form.append("image", buffer, { filename, contentType: "image/jpeg" });

  const response = await axios.post<{ result: InspectionResult }>(
    `${AI_SERVICE_URL}/predict`,
    form,
    { headers: form.getHeaders(), timeout: 30000 }
  );

  return response.data.result;
}
