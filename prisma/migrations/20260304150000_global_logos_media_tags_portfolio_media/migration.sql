-- Add page-level logo variant selector (default: primary)
ALTER TABLE "Page" ADD COLUMN "logo_variant" TEXT NOT NULL DEFAULT 'primary';

-- Add secondary global logo path
ALTER TABLE "Settings" ADD COLUMN "logo_secondary_path" TEXT;

-- Media assets metadata for CMS tags
CREATE TABLE "MediaAsset" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "file_url" TEXT NOT NULL,
  "tag" TEXT NOT NULL DEFAULT 'other',
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "MediaAsset_file_url_key" ON "MediaAsset"("file_url");
