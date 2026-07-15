import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const boxTypes = ["Gps5", "Cimc", "Gp1", "Nikken", "Aneos"];

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
