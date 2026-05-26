-- CreateEnum
CREATE TYPE "IssuePriority" AS ENUM ('low', 'medium', 'high');

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "priority" "IssuePriority" NOT NULL DEFAULT 'medium';
