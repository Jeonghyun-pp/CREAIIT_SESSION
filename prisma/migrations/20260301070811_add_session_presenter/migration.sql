-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "presenterId" TEXT;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_presenterId_fkey" FOREIGN KEY ("presenterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
