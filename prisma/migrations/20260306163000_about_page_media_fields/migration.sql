-- Add editable About page media/caption fields
ALTER TABLE "Page" ADD COLUMN "about_origin_images" TEXT;
ALTER TABLE "Page" ADD COLUMN "about_story_images" TEXT;
ALTER TABLE "Page" ADD COLUMN "about_story_captions" TEXT;
ALTER TABLE "Page" ADD COLUMN "about_work_images" TEXT;
