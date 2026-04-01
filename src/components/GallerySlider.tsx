import React, { useState, useEffect, useRef } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { currentCategory } from '../store/galleryStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Lightbox } from './Lightbox';
import type { GalleryItem } from '../lib/api';
import { getImageSizes, getImageSrcSet, getImageUrl } from '../lib/api';

type SliderLayout = {
  slideWidthVw: number;
  visibleCount: number;
};

const getLayoutForWidth = (width: number): SliderLayout => {
  // Desktop: 3 slides, Tablet: 2 slides, Mobile: 1 slide
  if (width >= 1024) return { slideWidthVw: 33.333, visibleCount: 3 };
  if (width >= 768) return { slideWidthVw: 50, visibleCount: 2 };
  return { slideWidthVw: 100, visibleCount: 1 };
};

interface GallerySliderProps {
  data: Record<string, GalleryItem[]>;
  categoryOverride?: string;
  showCta?: boolean;
}

export const GallerySlider: React.FC<GallerySliderProps> = ({
  data,
  categoryOverride,
  showCta = true,
}) => {
  const storeCategory = useStore(currentCategory);
  const category = categoryOverride || storeCategory;

  // Map API items to component expected format {id, src, alt}
  const originalImages = (data[category] || []).map((item) => ({
    id: item.id,
    src: getImageUrl(item.image_path),
    srcSet: getImageSrcSet(item.image_path),
    sizes: getImageSizes('gallery'),
    alt: item.alt || item.title || 'Gallery Image',
  }));
  const [currentIndex, setCurrentIndex] = useState(originalImages.length);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [layout, setLayout] = useState<SliderLayout>({ slideWidthVw: 33.333, visibleCount: 3 });
  const [slideWidthPx, setSlideWidthPx] = useState(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragStartX = useRef(0);
  const shouldSuppressClickRef = useRef(false);
  const lastAnimationStop = useRef<(() => void) | null>(null);
  const slideWidthPxRef = useRef(0);
  const x = useMotionValue(0);

  // Triple the images to allow seamless infinite scrolling
  const images = [...originalImages, ...originalImages, ...originalImages];

  // Update images and reset index when category changes
  useEffect(() => {
    setCurrentIndex(originalImages.length);
    setIsAnimating(false);
  }, [category, originalImages.length]);

  // Determine how many slides are visible (and slide width) based on viewport.
  // Note: component is server-rendered then hydrated; avoid touching `window` during initial render.
  useEffect(() => {
    const updateLayout = () => {
      const nextLayout = getLayoutForWidth(window.innerWidth);
      setLayout(nextLayout);
      const nextWidthPx = (window.innerWidth * nextLayout.slideWidthVw) / 100;
      slideWidthPxRef.current = nextWidthPx;
      setSlideWidthPx(nextWidthPx);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  // Handle the "snap" for infinite loop
  useEffect(() => {
    if (!isAnimating) {
      const len = originalImages.length;
      if (len === 0) return;

      if (currentIndex >= len * 2) {
        setCurrentIndex((prev) => prev - len);
        if (slideWidthPxRef.current > 0) {
          x.set(x.get() + len * slideWidthPxRef.current);
        }
      } else if (currentIndex < len) {
        setCurrentIndex((prev) => prev + len);
        if (slideWidthPxRef.current > 0) {
          x.set(x.get() - len * slideWidthPxRef.current);
        }
      }
    }
  }, [currentIndex, isAnimating, originalImages.length, x]);

  useEffect(() => {
    if (isDragging || slideWidthPx === 0) return;
    const target = -currentIndex * slideWidthPx;
    setIsAnimating(true);
    const controls = animate(x, target, {
      duration: 1.1,
      ease: 'easeInOut',
      onComplete: () => setIsAnimating(false),
    });
    lastAnimationStop.current = () => controls.stop();
    return () => controls.stop();
  }, [currentIndex, isDragging, slideWidthPx, x]);

  // Autoplay Logic
  useEffect(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }

    if (!isHovered && !lightboxOpen && !isDragging) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 5000);
    }

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isHovered, lightboxOpen, isDragging]);

  const moveSlides = (delta: number) => {
    setCurrentIndex((prev) => prev + delta);
  };

  const nextSlide = () => moveSlides(1);

  const prevSlide = () => moveSlides(-1);

  const handleDragStart = (event: any, info: any) => {
    if (lastAnimationStop.current) lastAnimationStop.current();
    setIsDragging(true);
    shouldSuppressClickRef.current = false;
    dragStartX.current = info.point.x;
  };

  const handleDragEnd = (event: any, info: any) => {
    const widthPx = slideWidthPxRef.current || (window.innerWidth * layout.slideWidthVw) / 100;
    const threshold = Math.min(140, Math.max(50, widthPx * 0.2));
    const dragDistance = Math.abs(info.point.x - dragStartX.current);
    if (dragDistance > 6) {
      shouldSuppressClickRef.current = true;
    }
    let delta = Math.round(-info.offset.x / widthPx);
    if (delta === 0 && dragDistance > threshold) {
      delta = info.offset.x < 0 ? 1 : -1;
    }

    setIsDragging(false);

    if (dragDistance > threshold && delta !== 0) {
      shouldSuppressClickRef.current = true;
      setCurrentIndex((prev) => prev + delta);
      return;
    }

    const target = -currentIndex * widthPx;
    setIsAnimating(true);
    const controls = animate(x, target, {
      duration: 0.35,
      ease: 'easeOut',
      onComplete: () => setIsAnimating(false),
    });
    lastAnimationStop.current = () => controls.stop();
  };

  const handleImageClick = (index: number) => {
    if (shouldSuppressClickRef.current) {
      shouldSuppressClickRef.current = false;
      return;
    }
    if (isDragging) return;

    // Calculate the actual image index in the original array
    const actualIndex = index % originalImages.length;
    setLightboxIndex(actualIndex);
    setLightboxOpen(true);
  };

  const handleLightboxNavigate = (newIndex: number) => {
    setLightboxIndex(newIndex);
  };

  if (originalImages.length === 0) return null;

  const activeIndex =
    ((currentIndex % originalImages.length) + originalImages.length) % originalImages.length;

  return (
    <>
      <div
        id="gallery"
        className="relative flex h-[75vh] w-full flex-col items-center justify-center overflow-hidden bg-dark-bg"
      >
        <div
          className="relative h-full w-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Images Strip */}
          <motion.div
            className="flex h-full cursor-grab active:cursor-grabbing"
            style={{ x }}
            drag="x"
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {images.map((img, i) => (
              <div
                key={`${img.id}-${i}`}
                className="group relative h-full w-full flex-shrink-0 cursor-pointer md:w-1/2 lg:w-1/3"
                onClick={() => handleImageClick(i)}
              >
                <img
                  src={img.src}
                  srcSet={img.srcSet || undefined}
                  sizes={img.srcSet ? img.sizes : undefined}
                  loading="lazy"
                  decoding="async"
                  alt={img.alt}
                  data-lightbox="off"
                  className="pointer-events-none h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  draggable={false}
                />
                <div className="pointer-events-none absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-transparent" />
              </div>
            ))}
          </motion.div>

          {/* Dynamic CTA Button Overlay */}
          {showCta && (
            <div className="pointer-events-auto absolute bottom-16 left-1/2 z-20 -translate-x-1/2 transform">
              <a
                href={`${import.meta.env.BASE_URL}${category === 'wedding' ? 'wedding-photography' : category === 'portrait' ? 'portrait-photography' : category === 'product' ? 'product-photography' : category}`}
                className="btn-primary shadow-xl"
              >
                <span className="font-display">More about</span>
                <span className="font-display font-semibold">{category}</span>
              </a>
            </div>
          )}

          {/* Counter */}
          <div className="absolute bottom-5 left-6 z-10 font-display text-xs tracking-[0.2em] text-white/70">
            <span className="text-[#d4af37]">{String(activeIndex + 1).padStart(2, '0')}</span>
            {' / '}
            {String(originalImages.length).padStart(2, '0')}
          </div>

          {/* Dot indicators */}
          <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {originalImages.map((_, i) => {
              return (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentIndex(originalImages.length + i);
                  }}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-[2px] transition-all duration-300 ${
                    i === activeIndex ? 'w-8 bg-[#d4af37]' : 'w-4 bg-white/40 hover:bg-white/70'
                  }`}
                />
              );
            })}
          </div>

          {/* Prev Button Overlay */}
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/55 text-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.24)] transition-all hover:border-[#d4af37] hover:bg-[#d4af37] hover:text-black"
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>

          {/* Next Button Overlay */}
          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/55 text-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.24)] transition-all hover:border-[#d4af37] hover:bg-[#d4af37] hover:text-black"
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        images={originalImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={handleLightboxNavigate}
      />
    </>
  );
};
