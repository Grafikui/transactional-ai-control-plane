-- CreateTable
CREATE TABLE "AuditEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidenceType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    CONSTRAINT "AuditEvidence_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
