-- Add wedding slider and portfolio fields
ALTER TABLE "Page" ADD COLUMN "wedding_slider_images" TEXT;
ALTER TABLE "Page" ADD COLUMN "portfolio_gallery_ids" TEXT;

-- Add gallery cover image
ALTER TABLE "Gallery" ADD COLUMN "cover_image" TEXT;
