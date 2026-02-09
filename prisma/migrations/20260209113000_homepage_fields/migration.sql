-- Add homepage configuration fields to Page
ALTER TABLE "Page" ADD COLUMN "home_gallery_wedding_id" INTEGER;
ALTER TABLE "Page" ADD COLUMN "home_gallery_portrait_id" INTEGER;
ALTER TABLE "Page" ADD COLUMN "home_gallery_product_id" INTEGER;
ALTER TABLE "Page" ADD COLUMN "home_moments_image" TEXT;
ALTER TABLE "Page" ADD COLUMN "home_latest_moments_bg" TEXT;
ALTER TABLE "Page" ADD COLUMN "home_latest_gallery_ids" TEXT;
ALTER TABLE "Page" ADD COLUMN "home_testimonial_ids" TEXT;
