import React, { useState, useEffect, useRef } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { currentCategory, type GalleryCategory } from '../store/galleryStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Lightbox } from './Lightbox';
import type { GalleryItem } from '../lib/api';
import { getImageSizes, getImageSrcSet, getImageUrl } from '../lib/api';

type SliderLayout = {
  slideWidthVw: number;
  visibleCount: number;
};

const getLayoutForWidth = (width: number): SliderLayout => {
  // Tailwind defaults: sm=640, md=768, lg=1024
  if (width >= 1024) return { slideWidthVw: 25, visibleCount: 4 };
  if (width >= 768) return { slideWidthVw: 33.333, visibleCount: 3 };
  if (width >= 640) return { slideWidthVw: 50, visibleCount: 2 };
  return { slideWidthVw: 80, visibleCount: 1 };
};

interface GallerySliderProps {
  data: Record<string, GalleryItem[]>;
}

export const GallerySlider: React.FC<GallerySliderProps> = ({ data }) => {
  const category = useStore(currentCategory);

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
  const [layout, setLayout] = useState<SliderLayout>({ slideWidthVw: 25, visibleCount: 4 });
  const [slideWidthPx, setSlideWidthPx] = useState(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragStartX = useRef(0);
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

  const nextPage = () => moveSlides(layout.visibleCount);

  const prevPage = () => moveSlides(-layout.visibleCount);

  const handleDragStart = (event: any, info: any) => {
    if (lastAnimationStop.current) lastAnimationStop.current();
    setIsDragging(true);
    dragStartX.current = info.point.x;
  };

  const handleDragEnd = (event: any, info: any) => {
    const widthPx = slideWidthPxRef.current || (window.innerWidth * layout.slideWidthVw) / 100;
    const threshold = Math.min(140, Math.max(50, widthPx * 0.2));
    const dragDistance = Math.abs(info.point.x - dragStartX.current);
    let delta = Math.round(-info.offset.x / widthPx);
    if (delta === 0 && dragDistance > threshold) {
      delta = info.offset.x < 0 ? 1 : -1;
    }

    setIsDragging(false);

    if (dragDistance > threshold && delta !== 0) {
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
    if (isDragging) return;

    // Calculate the actual image index in the original array
    const actualIndex = index % originalImages.length;
    setLightboxIndex(actualIndex);
    setLightboxOpen(true);
  };

  const handleLightboxNavigate = (newIndex: number) => {
    setLightboxIndex(newIndex);
  };

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
                className="group relative h-full w-[80vw] flex-shrink-0 cursor-pointer sm:w-[50vw] md:w-[33.333vw] lg:w-[25vw]"
                onClick={() => handleImageClick(i)}
              >
                <img
                  src={img.src}
                  srcSet={img.srcSet || undefined}
                  sizes={img.srcSet ? img.sizes : undefined}
                  loading="lazy"
                  decoding="async"
                  alt={img.alt}
                  className="pointer-events-none h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  draggable={false}
                />
                <div className="pointer-events-none absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-transparent" />
              </div>
            ))}
          </motion.div>

          {/* Dynamic CTA Button Overlay */}
          <div className="pointer-events-auto absolute bottom-12 left-1/2 z-20 -translate-x-1/2 transform">
            <a
              href={`${import.meta.env.BASE_URL}${category === 'wedding' ? 'wedding-photography' : category === 'portrait' ? 'portrait-photography' : category === 'product' ? 'product-photography' : category}`}
              className="btn-primary shadow-xl"
            >
              <span className="font-display">More about</span>
              <span className="font-display font-semibold">{category}</span>
            </a>
          </div>

          {/* Prev Button Overlay */}
          <button
            onClick={prevPage}
            className="pointer-events-auto absolute left-4 top-1/2 z-20 -translate-y-1/2 transform p-2 text-white/50 mix-blend-difference transition-colors hover:text-white"
          >
            <motion.div
              animate={{ x: [-5, 0, -5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronLeft size={48} strokeWidth={1} />
            </motion.div>
          </button>

          {/* Next Button Overlay */}
          <button
            onClick={nextPage}
            className="pointer-events-auto absolute right-4 top-1/2 z-20 -translate-y-1/2 transform p-2 text-white/50 mix-blend-difference transition-colors hover:text-white"
          >
            <motion.div
              animate={{ x: [5, 0, 5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronRight size={48} strokeWidth={1} />
            </motion.div>
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
