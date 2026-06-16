-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('Leader', 'Employee');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "EscalationPolicy" DROP CONSTRAINT "EscalationPolicy_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "IncidentAction" DROP CONSTRAINT "IncidentAction_incidentId_fkey";

-- DropForeignKey
ALTER TABLE "IncidentAction" DROP CONSTRAINT "IncidentAction_performedById_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_teamId_fkey";

-- DropForeignKey
ALTER TABLE "_TeamToUser" DROP CONSTRAINT "_TeamToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_TeamToUser" DROP CONSTRAINT "_TeamToUser_B_fkey";

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "teamId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "companyName" TEXT NOT NULL,
ADD COLUMN     "employeeOrder" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "leaderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "leaderId" TEXT,
ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'Approved',
ALTER COLUMN "role" DROP DEFAULT,
ALTER COLUMN "companyName" SET NOT NULL;

-- DropTable
DROP TABLE "EscalationPolicy";

-- DropTable
DROP TABLE "IncidentAction";

-- DropTable
DROP TABLE "_TeamToUser";

-- DropEnum
DROP TYPE "ActionStatus";

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TeamMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TeamMembers_AB_unique" ON "_TeamMembers"("A", "B");

-- CreateIndex
CREATE INDEX "_TeamMembers_B_index" ON "_TeamMembers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Team_companyName_key" ON "Team"("companyName");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamMembers" ADD CONSTRAINT "_TeamMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamMembers" ADD CONSTRAINT "_TeamMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

