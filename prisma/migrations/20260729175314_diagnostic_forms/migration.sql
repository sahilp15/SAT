-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DiagnosticResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formId" INTEGER NOT NULL DEFAULT 1,
    "mathScore" INTEGER NOT NULL,
    "rwScore" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "mathLow" INTEGER NOT NULL,
    "mathHigh" INTEGER NOT NULL,
    "rwLow" INTEGER NOT NULL,
    "rwHigh" INTEGER NOT NULL,
    "totalLow" INTEGER NOT NULL,
    "totalHigh" INTEGER NOT NULL,
    "mathTheta" REAL NOT NULL,
    "mathSe" REAL NOT NULL,
    "rwTheta" REAL NOT NULL,
    "rwSe" REAL NOT NULL,
    "confidence" TEXT NOT NULL,
    "accuracyPct" REAL NOT NULL,
    "breakdownJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiagnosticResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiagnosticSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiagnosticResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DiagnosticResult" ("accuracyPct", "breakdownJson", "confidence", "createdAt", "id", "mathHigh", "mathLow", "mathScore", "mathSe", "mathTheta", "rwHigh", "rwLow", "rwScore", "rwSe", "rwTheta", "sessionId", "totalHigh", "totalLow", "totalScore", "userId") SELECT "accuracyPct", "breakdownJson", "confidence", "createdAt", "id", "mathHigh", "mathLow", "mathScore", "mathSe", "mathTheta", "rwHigh", "rwLow", "rwScore", "rwSe", "rwTheta", "sessionId", "totalHigh", "totalLow", "totalScore", "userId" FROM "DiagnosticResult";
DROP TABLE "DiagnosticResult";
ALTER TABLE "new_DiagnosticResult" RENAME TO "DiagnosticResult";
CREATE UNIQUE INDEX "DiagnosticResult_sessionId_key" ON "DiagnosticResult"("sessionId");
CREATE INDEX "DiagnosticResult_userId_createdAt_idx" ON "DiagnosticResult"("userId", "createdAt");
CREATE TABLE "new_DiagnosticSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "formId" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "formJson" TEXT NOT NULL,
    "mathTrack" TEXT,
    "rwTrack" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DiagnosticSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DiagnosticSession" ("currentIndex", "formJson", "id", "mathTrack", "rwTrack", "startedAt", "status", "submittedAt", "updatedAt", "userId") SELECT "currentIndex", "formJson", "id", "mathTrack", "rwTrack", "startedAt", "status", "submittedAt", "updatedAt", "userId" FROM "DiagnosticSession";
DROP TABLE "DiagnosticSession";
ALTER TABLE "new_DiagnosticSession" RENAME TO "DiagnosticSession";
CREATE INDEX "DiagnosticSession_userId_status_idx" ON "DiagnosticSession"("userId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
