import express from "express";
import cors from "cors";
import boxTypesRouter from "./routes/boxTypes.js";
import inspectionRouter from "./routes/inspection.js";
import { ensureUploadDir } from "./services/storage.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

app.use(cors());
app.use(express.json());

ensureUploadDir();

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/box-types", boxTypesRouter);
app.use("/api/inspection", inspectionRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
