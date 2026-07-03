-- CreateTable
CREATE TABLE "FunctionCall" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "callerName" TEXT NOT NULL,
    "calleeName" TEXT NOT NULL,
    "line" INTEGER NOT NULL,
    "column" INTEGER NOT NULL,
    "resolvedSymbolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunctionCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FunctionCall_fileId_idx" ON "FunctionCall"("fileId");

-- CreateIndex
CREATE INDEX "FunctionCall_callerName_idx" ON "FunctionCall"("callerName");

-- CreateIndex
CREATE INDEX "FunctionCall_calleeName_idx" ON "FunctionCall"("calleeName");

-- AddForeignKey
ALTER TABLE "FunctionCall" ADD CONSTRAINT "FunctionCall_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
