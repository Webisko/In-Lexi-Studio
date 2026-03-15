-- Add missing FAQ items column for homepage and page-level FAQ repeater
ALTER TABLE "Page" ADD COLUMN "faq_items" TEXT;
