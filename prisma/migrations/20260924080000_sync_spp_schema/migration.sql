-- Bring the database schema in sync with the current Prisma schema.
-- This migration preserves existing billing data and maps legacy ACTIVE bills to UNPAID.

-- School-level default SPP amount
ALTER TABLE "SchoolSetting"
ADD COLUMN "defaultSppAmount" DECIMAL(14,2);

-- Optional per-student SPP override
ALTER TABLE "Student"
ADD COLUMN "customSppAmount" DECIMAL(14,2);

-- New billing period/snapshot fields
ALTER TABLE "Bill"
ADD COLUMN "billingMonth" INTEGER,
ADD COLUMN "billingYear" INTEGER,
ADD COLUMN "originalAmount" DECIMAL(14,2);

-- Replace the legacy BillStatus enum safely while preserving existing rows.
ALTER TABLE "Bill" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "BillStatus" RENAME TO "BillStatus_old";

CREATE TYPE "BillStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'CANCELLED');

ALTER TABLE "Bill"
ALTER COLUMN "status" TYPE "BillStatus"
USING (
  CASE "status"::text
    WHEN 'ACTIVE' THEN 'UNPAID'
    WHEN 'CANCELLED' THEN 'CANCELLED'
    ELSE 'UNPAID'
  END
)::"BillStatus";

ALTER TABLE "Bill" ALTER COLUMN "status" SET DEFAULT 'UNPAID'::"BillStatus";

DROP TYPE "BillStatus_old";

-- One SPP bill per student/month/year.
CREATE UNIQUE INDEX "Bill_studentId_billingMonth_billingYear_key"
ON "Bill"("studentId", "billingMonth", "billingYear");
