ALTER TABLE "User" ADD COLUMN "name" TEXT;

UPDATE "User"
SET "name" = 'Filip'
WHERE lower("email") = 'admin@webisko.pl' AND ("name" IS NULL OR trim("name") = '');

UPDATE "User"
SET "name" = 'Alex'
WHERE lower("email") = 'info@inlexistudio.com' AND ("name" IS NULL OR trim("name") = '');

CREATE TABLE "EmailChangeToken" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "user_id" INTEGER NOT NULL,
  "new_email" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" DATETIME NOT NULL,
  "used_at" DATETIME,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailChangeToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "EmailChangeToken_token_hash_key" ON "EmailChangeToken"("token_hash");