import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 운영진(ADMIN) 출석 기록 삭제
  const deleted = await prisma.attendance.deleteMany({
    where: { user: { role: "ADMIN" } },
  });
  console.log(`삭제된 ADMIN 출석 기록: ${deleted.count}건`);

  // 남은 출석 기록 확인
  const remaining = await prisma.attendance.findMany({
    include: { user: { select: { name: true, role: true } }, session: { select: { title: true } } },
  });
  console.log(`\n남은 출석 기록: ${remaining.length}건`);
  for (const a of remaining) {
    console.log(`  ${a.user.name} (${a.user.role}) -> ${a.session.title} : ${a.status}`);
  }
}

main()
  .catch((e) => console.error("Error:", e.message))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  });
