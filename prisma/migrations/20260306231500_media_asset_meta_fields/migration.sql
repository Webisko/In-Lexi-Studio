-- Add SEO metadata fields to media assets
ALTER TABLE "MediaAsset" ADD COLUMN "title_text" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN "alt_text" TEXT;
