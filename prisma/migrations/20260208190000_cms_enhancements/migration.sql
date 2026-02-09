-- Add new CMS fields for single-language content, SEO, settings, and analytics.

-- User
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'ADMIN';

-- Page
ALTER TABLE "Page" ADD COLUMN "title" TEXT;
ALTER TABLE "Page" ADD COLUMN "content" TEXT;
ALTER TABLE "Page" ADD COLUMN "seo_image" TEXT;
ALTER TABLE "Page" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Page" ADD COLUMN "is_home" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Page" ADD COLUMN "seo_use_hero" BOOLEAN NOT NULL DEFAULT true;

-- Gallery
ALTER TABLE "Gallery" ADD COLUMN "name" TEXT;

-- GalleryItem
ALTER TABLE "GalleryItem" ADD COLUMN "title" TEXT;
ALTER TABLE "GalleryItem" ADD COLUMN "alt" TEXT;

-- Testimonial
ALTER TABLE "Testimonial" ADD COLUMN "content" TEXT;
ALTER TABLE "Testimonial" ADD COLUMN "avatar_image" TEXT;
ALTER TABLE "Testimonial" ADD COLUMN "gallery_id" INTEGER;
CREATE UNIQUE INDEX "Testimonial_gallery_id_key" ON "Testimonial"("gallery_id");

-- Settings
ALTER TABLE "Settings" ADD COLUMN "meta_title" TEXT;
ALTER TABLE "Settings" ADD COLUMN "meta_description" TEXT;
ALTER TABLE "Settings" ADD COLUMN "og_image" TEXT;
ALTER TABLE "Settings" ADD COLUMN "favicon" TEXT;
ALTER TABLE "Settings" ADD COLUMN "canonical_base_url" TEXT;
ALTER TABLE "Settings" ADD COLUMN "head_html" TEXT;
ALTER TABLE "Settings" ADD COLUMN "body_html" TEXT;
ALTER TABLE "Settings" ADD COLUMN "cta_text" TEXT;
ALTER TABLE "Settings" ADD COLUMN "cta_url" TEXT;
ALTER TABLE "Settings" ADD COLUMN "footer_text" TEXT;
ALTER TABLE "Settings" ADD COLUMN "privacy_url" TEXT;
ALTER TABLE "Settings" ADD COLUMN "umami_script_url" TEXT;
ALTER TABLE "Settings" ADD COLUMN "umami_website_id" TEXT;
ALTER TABLE "Settings" ADD COLUMN "umami_domains" TEXT;
ALTER TABLE "Settings" ADD COLUMN "umami_dashboard_url" TEXT;
