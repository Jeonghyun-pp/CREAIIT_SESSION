import path from "node:path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "..", ".env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const dbUrl = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const sessions = await prisma.session.findMany({
    orderBy: { date: "asc" },
    include: { blocks: { orderBy: { order: "asc" } }, assets: true },
  });

  for (const s of sessions) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`ID: ${s.id}`);
    console.log(`Title: ${s.title}`);
    console.log(`Date: ${s.date.toISOString().split("T")[0]}`);
    console.log(`Published: ${s.published}`);
    console.log(`Summary: ${s.summary}`);
    console.log(`Goals: ${JSON.stringify(s.goals)}`);
    console.log(`Prerequisites: ${JSON.stringify(s.prerequisites)}`);
    console.log(`Assets: ${s.assets.length}`);
    console.log(`\nBlocks (${s.blocks.length}):`);
    for (const b of s.blocks) {
      const time = b.startTime ? ` [${b.startTime}-${b.endTime}]` : "";
      console.log(`\n  --- Block ${b.order} (${b.type}) ---`);
      console.log(`  Title: ${b.title}${time}`);
      if (b.description) {
        console.log(`  Description:\n${b.description}`);
      }
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
