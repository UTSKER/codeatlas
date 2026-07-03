-- CreateTable
CREATE TABLE "Export" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "SymbolKind" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "symbolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Export_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Export_fileId_idx" ON "Export"("fileId");

-- CreateIndex
CREATE INDEX "Export_name_idx" ON "Export"("name");

-- CreateIndex
CREATE INDEX "Export_symbolId_idx" ON "Export"("symbolId");

-- AddForeignKey
ALTER TABLE "Export" ADD CONSTRAINT "Export_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Export" ADD CONSTRAINT "Export_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "Symbol"("id") ON DELETE SET NULL ON UPDATE CASCADE;
