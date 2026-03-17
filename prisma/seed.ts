import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 12);
  
  // 1. Create Demo User
  console.log("🌱 Seeding demo user...");
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Alex Demo",
      password: hashedPassword,
    },
  });

  // 2. Create Workspace
  console.log("🌱 Seeding workspace...");
  const workspace = await prisma.workspace.create({
    data: {
      name: "Alex's Creator Store",
      slug: `alex-store-${Math.random().toString(36).slice(2, 6)}`,
    },
  });

  await prisma.membership.create({
    data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" },
  });

  // 3. Create Subscription
  await prisma.subscription.create({
    data: { workspaceId: workspace.id, tier: "STARTER", status: "ACTIVE" },
  });

  // 4. Create Social Connection & Assets
  console.log("🌱 Seeding social connections...");
  const connection = await prisma.socialConnection.create({
    data: {
      workspaceId: workspace.id,
      platform: "INSTAGRAM",
      externalUserId: "ig_user_123",
      displayName: "alex_creations",
      accessToken: "mock_token",
    },
  });

  const asset = await prisma.connectedAsset.create({
    data: {
      workspaceId: workspace.id,
      socialConnectionId: connection.id,
      assetType: "INSTAGRAM_ACCOUNT",
      externalAssetId: "ig_acc_123",
      name: "Alex Creations",
      username: "alex_creations",
      isActive: true,
      webhookSubscribed: true,
      accessToken: "mock_asset_token",
    },
  });

  // 5. Create Sample Automations
  console.log("🌱 Seeding automation rules...");
  const template = await prisma.messageTemplate.create({
    data: {
      workspaceId: workspace.id,
      name: "Pricing Info",
      body: "Hey {{commenter_name}}! Thanks for asking. Our starter pack is $29. Check it here: https://example.com/pricing",
    },
  });

  await prisma.automationRule.create({
    data: {
      workspaceId: workspace.id,
      name: "Price Keywords",
      platform: "INSTAGRAM",
      connectedAssetId: asset.id,
      status: "ACTIVE",
      totalSent: 142,
      messageTemplateId: template.id,
      keywords: {
        create: [
          { keyword: "price" },
          { keyword: "cost" },
          { keyword: "how much" },
        ],
      },
    },
  });

  // 6. Seed some fake logs for UI
  console.log("🌱 Seeding fake logs...");
  const job = await prisma.outboundMessageJob.create({
    data: {
      workspaceId: workspace.id,
      platform: "INSTAGRAM",
      recipientId: "rec_1",
      recipientName: "John Doe",
      postId: "post_1",
      commentId: "comm_1",
      messageBody: "Hey John! Pricing is $29.",
      idempotencyKey: "123",
      status: "COMPLETED",
    }
  });

  await prisma.messageDeliveryLog.create({
    data: {
      workspaceId: workspace.id,
      jobId: job.id,
      platform: "INSTAGRAM",
      status: "SENT",
      postId: "post_1",
      commentId: "comm_1",
      recipientId: "rec_1",
      recipientName: "John Doe",
      matchedKeyword: "price",
    }
  });

  console.log("✅ Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
