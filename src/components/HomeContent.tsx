import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Gallery, GalleryItem, Page, Settings, Testimonial } from '../lib/api';
import { getGalleries, getHomePage, getSettings, getTestimonials } from '../lib/api';
import { Hero } from './Hero';
import { GallerySlider } from './GallerySlider';
import { WelcomeSection } from './WelcomeSection';
import { AboutFeature } from './AboutFeature';
import { LatestMoments } from './LatestMoments';
import { Collage } from './Collage';
import { Testimonials } from './Testimonials';

interface HomeContentProps {
  initialHome?: Page | null;
  initialGalleries?: Gallery[] | null;
  initialTestimonials?: Testimonial[] | null;
  initialSettings?: Settings | null;
}

const parseJsonArray = (value: unknown) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }
  return [];
};

const parseIdArray = (value: unknown): number[] => {
  const parsed = parseJsonArray(value) as unknown[];
  return parsed.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0);
};

const buildImageItems = (images?: string[] | null): GalleryItem[] => {
  if (!images || !images.length) return [];
  return images.map((image, index) => ({
    id: index + 1,
    image_path: image,
    alt: 'Gallery image',
  }));
};

export const HomeContent: React.FC<HomeContentProps> = ({
  initialHome,
  initialGalleries,
  initialTestimonials,
  initialSettings,
}) => {
  const [homePage, setHomePage] = useState<Page | null>(initialHome || null);
  const [galleries, setGalleries] = useState<Gallery[]>(initialGalleries || []);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials || []);
  const [settings, setSettings] = useState<Settings | null>(initialSettings || null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const [homeRes, galleriesRes, testimonialsRes, settingsRes] = await Promise.all([
      getHomePage(),
      getGalleries(),
      getTestimonials(),
      getSettings(),
    ]);

    if (!isMountedRef.current) return;
    if (homeRes) setHomePage(homeRes);
    if (galleriesRes) setGalleries(galleriesRes);
    if (testimonialsRes) setTestimonials(testimonialsRes);
    if (settingsRes) setSettings(settingsRes);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let lastRun = 0;

    const revalidate = () => {
      const now = Date.now();
      if (now - lastRun < 5000) return;
      lastRun = now;
      load();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        revalidate();
      }
    };

    window.addEventListener('focus', revalidate);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', revalidate);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [load]);

  const { galleryMap, latestMoments, testimonialsData } = useMemo(() => {
    const galleryList = galleries || [];
    const galleryById = new Map(galleryList.map((g) => [g.id, g]));

    const selectedGalleries = {
      wedding: homePage?.home_gallery_wedding_id
        ? galleryById.get(homePage.home_gallery_wedding_id)
        : galleryList.find((g) => g.category === 'wedding'),
      portrait: homePage?.home_gallery_portrait_id
        ? galleryById.get(homePage.home_gallery_portrait_id)
        : galleryList.find((g) => g.category === 'portrait'),
      product: homePage?.home_gallery_product_id
        ? galleryById.get(homePage.home_gallery_product_id)
        : galleryList.find((g) => g.category === 'product'),
    };

    const weddingImages = buildImageItems(
      parseJsonArray(homePage?.home_gallery_wedding_images) as string[],
    );
    const portraitImages = buildImageItems(
      parseJsonArray(homePage?.home_gallery_portrait_images) as string[],
    );
    const productImages = buildImageItems(
      parseJsonArray(homePage?.home_gallery_product_images) as string[],
    );

    const nextGalleryMap: Record<string, GalleryItem[]> = {
      wedding: weddingImages.length ? weddingImages : selectedGalleries.wedding?.items || [],
      portrait: portraitImages.length ? portraitImages : selectedGalleries.portrait?.items || [],
      product: productImages.length ? productImages : selectedGalleries.product?.items || [],
    };

    const latestGalleryIds = parseIdArray(homePage?.home_latest_gallery_ids);
    let latestGalleries = latestGalleryIds
      .map((id) => galleryById.get(id))
      .filter((g) => g && g.items && g.items.length) as Gallery[];
    if (latestGalleries.length === 0) {
      latestGalleries = galleryList.slice(0, 6).filter((g) => g.items && g.items.length);
    }

    const nextLatestMoments = latestGalleries.slice(0, 6).map((gallery) => {
      const cover = gallery.items[0];
      return {
        id: gallery.id,
        title: gallery.name || gallery.category || 'Gallery',
        description: gallery.short_description || '',
        testimonial: gallery.testimonial || null,
        image: cover?.image_path || '',
        images: (gallery.items || []).map((item) => item.image_path).filter(Boolean),
      };
    });

    const selectedTestimonials = parseIdArray(homePage?.home_testimonial_ids);
    const nextTestimonialsData = selectedTestimonials.length
      ? testimonials.filter((item) => selectedTestimonials.includes(item.id))
      : testimonials;

    return {
      galleryMap: nextGalleryMap,
      latestMoments: nextLatestMoments,
      testimonialsData: nextTestimonialsData,
    };
  }, [galleries, homePage, testimonials]);

  return (
    <main>
      <Hero data={homePage} settings={settings} />
      <GallerySlider data={galleryMap} />
      <WelcomeSection />
      <AboutFeature image={homePage?.home_moments_image} />
      <LatestMoments items={latestMoments} backgroundImage={homePage?.home_latest_moments_bg} />
      <Collage />
      <Testimonials data={testimonialsData} />
    </main>
  );
};
