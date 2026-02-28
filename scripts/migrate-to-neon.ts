import path from "node:path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "..", ".env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const LOCAL_URL = "postgresql://postgres:postgres@localhost:5432/creait_session";
const NEON_URL = process.argv[2];

if (!NEON_URL) {
  console.error("Usage: npx tsx scripts/migrate-to-neon.ts <NEON_DATABASE_URL>");
  process.exit(1);
}

function makeClient(url: string) {
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

async function main() {
  const local = makeClient(LOCAL_URL);
  const neon = makeClient(NEON_URL);

  // 1. Export all sessions + blocks from local
  const sessions = await local.session.findMany({
    include: { blocks: { orderBy: { order: "asc" } } },
    orderBy: { date: "asc" },
  });

  console.log(`Found ${sessions.length} sessions in local DB`);

  // 2. Export users
  const users = await local.user.findMany();
  console.log(`Found ${users.length} users in local DB`);

  // 3. Upsert users to Neon
  for (const u of users) {
    await neon.user.upsert({
      where: { email: u.email },
      update: { name: u.name, passwordHash: u.passwordHash, role: u.role, status: u.status },
      create: { id: u.id, email: u.email, name: u.name, passwordHash: u.passwordHash, role: u.role, status: u.status },
    });
    console.log(`  User: ${u.email} (${u.role})`);
  }

  // 4. For each session, delete if exists on Neon, then create fresh
  for (const s of sessions) {
    // Delete existing (cascade deletes blocks)
    await neon.session.deleteMany({ where: { id: s.id } });

    await neon.session.create({
      data: {
        id: s.id,
        title: s.title,
        date: s.date,
        summary: s.summary,
        goals: s.goals,
        prerequisites: s.prerequisites,
        published: s.published,
        createdAt: s.createdAt,
        blocks: {
          create: s.blocks.map((b) => ({
            order: b.order,
            type: b.type,
            title: b.title,
            description: b.description,
            startTime: b.startTime,
            endTime: b.endTime,
          })),
        },
      },
    });
    console.log(`  Session: ${s.title} (${s.blocks.length} blocks)`);
  }

  console.log("\nMigration complete!");

  await local.$disconnect();
  await neon.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
