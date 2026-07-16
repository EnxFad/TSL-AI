import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

const DEV_FALLBACK_BOX_TYPES = [
  { id: 1, name: "Gps5" },
  { id: 2, name: "Cimc" },
  { id: 3, name: "Gp1" },
  { id: 4, name: "Nikken" },
  { id: 5, name: "Eneos" },
  { id: 6, name: "Anqing" },
];

router.get("/", async (_req, res) => {
  try {
    const boxTypes = await prisma.boxType.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });
    res.json(boxTypes);
  } catch (error) {
    console.error("Failed to fetch box types, using fallback:", error);
    res.json(DEV_FALLBACK_BOX_TYPES);
  }
});

export default router;
