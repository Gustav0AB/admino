WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "memberId" ORDER BY "assignedAt" DESC, "id" DESC) AS rn
  FROM "training_plan_assignments"
)
DELETE FROM "training_plan_assignments"
USING ranked
WHERE "training_plan_assignments"."id" = ranked."id"
  AND ranked.rn > 1;

DROP INDEX IF EXISTS "training_plan_assignments_memberId_planId_key";

CREATE UNIQUE INDEX "training_plan_assignments_memberId_key"
ON "training_plan_assignments"("memberId");
