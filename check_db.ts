import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== RAW WEBHOOK EVENTS ===");
  const webhooks = await prisma.webhookEventRaw.findMany({
    orderBy: { receivedAt: "desc" },
    take: 3
  });
  console.log(JSON.stringify(webhooks, null, 2));

  console.log("\n=== TRIGGER EVENT LOGS ===");
  const triggers = await prisma.triggerEventLog.findMany({
    orderBy: { processedAt: "desc" },
    take: 3
  });
  console.log(JSON.stringify(triggers, null, 2));

  console.log("\n=== OUTBOUND JOBS ===");
  const jobs = await prisma.outboundMessageJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 3
  });
  console.log(JSON.stringify(jobs, null, 2));

  console.log("\n=== LOGS ===");
  const logs = await prisma.messageDeliveryLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 3
  });
  console.log(JSON.stringify(logs, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  });
