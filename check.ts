import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const jobs = await prisma.outboundMessageJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 5
  });
  console.log("=== JOBS ===");
  console.log(JSON.stringify(jobs, null, 2));

  const logs = await prisma.messageDeliveryLog.findMany({
    where: { status: "FAILED" },
    orderBy: { createdAt: "desc" },
    take: 5
  });
  console.log("=== LOGS ===");
  console.log(JSON.stringify(logs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
