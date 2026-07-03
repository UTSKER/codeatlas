/*
  Warnings:

  - You are about to drop the column `resolvedSymbolId` on the `FunctionCall` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FunctionCall" DROP COLUMN "resolvedSymbolId",
ADD COLUMN     "calleeSymbolId" TEXT,
ADD COLUMN     "callerSymbolId" TEXT,
ADD COLUMN     "resolved" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "FunctionCall_callerSymbolId_idx" ON "FunctionCall"("callerSymbolId");

-- CreateIndex
CREATE INDEX "FunctionCall_calleeSymbolId_idx" ON "FunctionCall"("calleeSymbolId");

-- AddForeignKey
ALTER TABLE "FunctionCall" ADD CONSTRAINT "FunctionCall_callerSymbolId_fkey" FOREIGN KEY ("callerSymbolId") REFERENCES "Symbol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionCall" ADD CONSTRAINT "FunctionCall_calleeSymbolId_fkey" FOREIGN KEY ("calleeSymbolId") REFERENCES "Symbol"("id") ON DELETE SET NULL ON UPDATE CASCADE;
