-- Create ratings table
CREATE TABLE IF NOT EXISTS "ratings" (
  "id" SERIAL PRIMARY KEY,
  "businessId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT "ratings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses" ("id") ON DELETE CASCADE,
  CONSTRAINT "ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "ratings_businessId_idx" ON "ratings" ("businessId");
CREATE INDEX IF NOT EXISTS "ratings_userId_idx" ON "ratings" ("userId");