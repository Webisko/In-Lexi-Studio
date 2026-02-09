-- Add homepage image list fields
ALTER TABLE "Page" ADD COLUMN "home_gallery_wedding_images" TEXT;
ALTER TABLE "Page" ADD COLUMN "home_gallery_portrait_images" TEXT;
ALTER TABLE "Page" ADD COLUMN "home_gallery_product_images" TEXT;
