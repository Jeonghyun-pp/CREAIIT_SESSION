import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const dbUrl = process.env.DATABASE_URL || "";
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const sessions = await prisma.session.findMany({
    orderBy: { date: "asc" },
    include: { blocks: { orderBy: { order: "asc" } }, assets: true },
  });

  console.log(`Total sessions: ${sessions.length}`);

  for (const s of sessions) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`ID: ${s.id}`);
    console.log(`Title: ${s.title}`);
    console.log(`Date: ${s.date.toISOString().split("T")[0]}`);
    console.log(`Published: ${s.published}`);
    console.log(`Summary: ${s.summary}`);
    console.log(`Goals: ${JSON.stringify(s.goals)}`);
    console.log(`Prerequisites: ${JSON.stringify(s.prerequisites)}`);
    console.log(`Blocks (${s.blocks.length}):`);
    for (const b of s.blocks) {
      const time = b.startTime ? ` [${b.startTime}-${b.endTime}]` : "";
      console.log(`  [${b.order}] ${b.type} | ${b.title}${time}`);
      if (b.description) {
        const desc = b.description.replace(/\n/g, " | ").substring(0, 300);
        console.log(`       ${desc}`);
      }
    }
    console.log(`Assets: ${s.assets.length}`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
