import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Gallery, MediaFile, Page, Testimonial } from '../lib/api';
import {
  getGalleries,
  getMediaFiles,
  getImageSizes,
  getImageSrcSet,
  getImageUrl,
  getPage,
  getTestimonials,
} from '../lib/api';
import WeddingPhotography from './pages/WeddingPhotography';
import About from './pages/About';
import Approach from './pages/Approach';
import Portfolio from './pages/Portfolio';
import ComingSoonLanding from './pages/ComingSoonLanding';

interface PageContentProps {
  initialPage: Page;
  initialGalleries?: Gallery[] | null;
  initialTestimonials?: Testimonial[] | null;
  initialMediaFiles?: MediaFile[] | null;
}

export const PageContent: React.FC<PageContentProps> = ({
  initialPage,
  initialGalleries,
  initialTestimonials,
  initialMediaFiles,
}) => {
  const [page, setPage] = useState<Page>(initialPage);
  const [galleries, setGalleries] = useState<Gallery[]>(initialGalleries || []);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials || []);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(initialMediaFiles || []);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const slug = initialPage?.slug;
    if (!slug) return;

    const [pageRes, galleriesRes, testimonialsRes, mediaRes] = await Promise.all([
      getPage(slug),
      getGalleries(),
      getTestimonials(),
      getMediaFiles(),
    ]);
    if (!isMountedRef.current) return;
    if (pageRes) setPage(pageRes);
    if (galleriesRes) setGalleries(galleriesRes);
    if (testimonialsRes) setTestimonials(testimonialsRes);
    if (mediaRes) setMediaFiles(mediaRes);
  }, [initialPage?.slug]);

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

  const heroSrc = useMemo(() => (page?.hero_image ? getImageUrl(page.hero_image) : ''), [page]);
  const heroSrcSet = useMemo(
    () => (page?.hero_image ? getImageSrcSet(page.hero_image) : ''),
    [page],
  );
  const heroSizes = heroSrcSet ? getImageSizes('hero') : '';

  if (!page) return null;

  const isWeddingPage = page.slug === 'wedding-photography';
  const isPortraitPage = page.slug === 'portrait-photography';
  const isProductPage = page.slug === 'product-photography';
  const isCustomTemplatePage =
    isWeddingPage || page.slug === 'about' || page.slug === 'approach' || page.slug === 'portfolio';
  const isPortraitOrProductLanding = isPortraitPage || isProductPage;
  const contentWrapperClassName = isPortraitOrProductLanding ? '' : 'min-h-screen';
  return (
    <main className={page.hero_image ? '' : 'pt-24'}>
      {page.hero_image && !isCustomTemplatePage && (
        <div
          data-page-hero
          className="relative h-[75vh] min-h-[560px] w-full overflow-hidden md:h-[90vh]"
        >
          <img
            src={heroSrc}
            srcSet={heroSrcSet || undefined}
            sizes={heroSrcSet ? heroSizes : undefined}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            alt={page.title}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080808]/10 to-[#080808]/35" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#080808]/30 to-[#080808]" />
          {isPortraitOrProductLanding && (
            <>
              <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-4">
                <div className="relative h-12 w-[1px] overflow-hidden bg-white/20">
                  <div className="landing-scroll-line absolute left-0 top-0 h-1/2 w-full bg-white" />
                </div>
                <p className="scroll-indicator-text font-display uppercase text-white/80">Scroll</p>
              </div>
            </>
          )}
          <div className="absolute inset-0 flex items-end justify-center px-4 pb-28 text-center md:pb-32">
            <h1 className="display-page-title bg-gradient-to-r from-[#d4af37] via-[#f3eacb] to-[#c5a059] bg-clip-text font-display text-transparent drop-shadow-lg">
              {page.title}
            </h1>
          </div>
        </div>
      )}

      <div className={contentWrapperClassName}>
        {page.slug === 'wedding-photography' ? (
          <WeddingPhotography page={page} testimonials={testimonials} />
        ) : page.slug === 'about' ? (
          <About page={page} />
        ) : page.slug === 'approach' ? (
          <Approach page={page} />
        ) : page.slug === 'portfolio' ? (
          <Portfolio page={page} galleries={galleries || []} mediaFiles={mediaFiles || []} />
        ) : isPortraitOrProductLanding ? (
          <ComingSoonLanding page={page} />
        ) : (
          <>
            <div className="prose prose-gold lg:prose-xl dark:prose-invert container mx-auto max-w-4xl px-4 py-16">
              {!page.hero_image && (
                <h1 className="display-section-title mb-8 text-center font-display">
                  {page.title}
                </h1>
              )}
              <article
                className="wysiwyg-content"
                dangerouslySetInnerHTML={{ __html: page.content || '' }}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
};
