/*
  Warnings:

  - You are about to drop the column `column` on the `Symbol` table. All the data in the column will be lost.
  - You are about to drop the column `line` on the `Symbol` table. All the data in the column will be lost.
  - Added the required column `endColumn` to the `Symbol` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endLine` to the `Symbol` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startColumn` to the `Symbol` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startLine` to the `Symbol` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EdgeType" AS ENUM ('DEFINES', 'IMPORTS', 'EXPORTS', 'CALLS');

-- AlterTable
ALTER TABLE "Symbol" DROP COLUMN "column",
DROP COLUMN "line",
ADD COLUMN     "endColumn" INTEGER NOT NULL,
ADD COLUMN     "endLine" INTEGER NOT NULL,
ADD COLUMN     "startColumn" INTEGER NOT NULL,
ADD COLUMN     "startLine" INTEGER NOT NULL;
