import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/", async (_req, res) => {
  try {
    const boxTypes = await prisma.boxType.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });
    res.json(boxTypes);
  } catch (error) {
    console.error("Failed to fetch box types:", error);
    res.status(500).json({ error: "Failed to fetch box types" });
  }
});

export default router;
