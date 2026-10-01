-- CreateTable
CREATE TABLE "workout_feedback" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "rpe" INTEGER,
    "notes" TEXT,

    CONSTRAINT "workout_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workout_feedback_memberId_date_key" ON "workout_feedback"("memberId", "date");

-- AddForeignKey
ALTER TABLE "workout_feedback" ADD CONSTRAINT "workout_feedback_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
