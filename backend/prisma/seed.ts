import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Rename any legacy "Aneos" record to "Eneos" (keeps its id/position).
  const legacy = await prisma.boxType.findFirst({ where: { name: "Aneos" } });
  if (legacy) {
    await prisma.boxType.update({
      where: { id: legacy.id },
      data: { name: "Eneos" },
    });
  }

  const boxTypes = ["Gps5", "Cimc", "Gp1", "Nikken", "Eneos", "Anqing"];

  for (const name of boxTypes) {
    const existing = await prisma.boxType.findFirst({ where: { name } });
    if (!existing) {
      await prisma.boxType.create({ data: { name } });
    }
  }

  console.log("Seeded box types:", boxTypes.join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
