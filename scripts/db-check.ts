import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const [users, sessions, submissions, attendances, assets, blocks] = await Promise.all([
    prisma.user.count(),
    prisma.session.count(),
    prisma.submission.count(),
    prisma.attendance.count(),
    prisma.asset.count(),
    prisma.sessionBlock.count(),
  ]);
  console.log("=== DB Table Counts ===");
  console.log("Users:", users);
  console.log("Sessions:", sessions);
  console.log("Submissions:", submissions);
  console.log("Attendances:", attendances);
  console.log("Assets:", assets);
  console.log("SessionBlocks:", blocks);

  const admins = await prisma.user.count({ where: { role: "ADMIN" } });
  const members = await prisma.user.count({ where: { role: "MEMBER" } });
  const activeMembers = await prisma.user.count({ where: { role: "MEMBER", status: "ACTIVE" } });
  const pendingMembers = await prisma.user.count({ where: { role: "MEMBER", status: "PENDING" } });
  console.log("\n=== User Breakdown ===");
  console.log("Admins:", admins);
  console.log("Members (total):", members);
  console.log("Members (active):", activeMembers);
  console.log("Members (pending):", pendingMembers);

  const attRecords = await prisma.attendance.findMany({
    include: { user: { select: { name: true, role: true } }, session: { select: { title: true } } },
  });
  console.log("\n=== Attendance Records ===");
  if (attRecords.length > 0) {
    for (const a of attRecords) {
      console.log(`  ${a.user.name} (${a.user.role}) -> ${a.session.title} : ${a.status}`);
    }
  } else {
    console.log("  (none)");
  }

  const migrations: any[] = await prisma.$queryRawUnsafe(
    "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at"
  );
  console.log("\n=== Migrations ===");
  for (const m of migrations) {
    console.log(`  ${m.migration_name} : ${m.finished_at ? "APPLIED" : "PENDING"}`);
  }

  console.log("\n✅ All tables accessible. DB connection OK.");
}

main()
  .catch((e) => {
    console.error("❌ DB Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  });
