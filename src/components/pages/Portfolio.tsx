import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, X, Quote } from 'lucide-react';
import type { Gallery, MediaFile, Page } from '../../lib/api';
import { getImageSizes, getImageSrcSet, getImageUrl } from '../../lib/api';

interface Props {
  page: Page;
  galleries?: Gallery[];
  mediaFiles?: MediaFile[];
}

const CATEGORY_LABELS: Record<string, string> = {
  wedding: 'Wedding',
  portrait: 'Portrait',
  product: 'Product',
  other: 'Other',
};

const CATEGORY_ORDER = ['Wedding', 'Portrait', 'Product', 'Other'];

export default function Portfolio({ page, galleries = [], mediaFiles = [] }: Props) {
  const [filter, setFilter] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Close lightbox when filter changes (index no longer valid)
  useEffect(() => {
    setSelectedIndex(null);
  }, [filter]);
  const selectedTokens = useMemo(
    () =>
      (page.portfolio_gallery_ids || []).map((item) => String(item || '').trim()).filter(Boolean),
    [page.portfolio_gallery_ids],
  );
  const selectedGalleryIds = useMemo(
    () => selectedTokens.map((item) => Number(item)).filter((id) => Number.isFinite(id) && id > 0),
    [selectedTokens],
  );
  const selectedMediaUrls = useMemo(
    () => selectedTokens.filter((item) => !Number.isFinite(Number(item))),
    [selectedTokens],
  );
  const selectedGalleries = useMemo(() => {
    if (!selectedGalleryIds.length) return [];
    const map = new Map(galleries.map((gallery) => [gallery.id, gallery]));
    return selectedGalleryIds.map((id) => map.get(id)).filter(Boolean) as Gallery[];
  }, [galleries, selectedGalleryIds]);

  const selectedMedia = useMemo(() => {
    if (!Array.isArray(mediaFiles) || mediaFiles.length === 0) return [];
    if (selectedMediaUrls.length === 0) return [];
    const selected = new Set(selectedMediaUrls);
    return mediaFiles.filter((file) => selected.has(file.url));
  }, [mediaFiles, selectedMediaUrls]);

  const portfolioItems = useMemo(() => {
    const galleryItems = selectedGalleries.flatMap((gallery) =>
      (gallery.items || []).map((item) => ({
        id: `${gallery.id}-${item.id}`,
        category: CATEGORY_LABELS[gallery.category] || gallery.category,
        src: getImageUrl(item.image_path),
        srcSet: getImageSrcSet(item.image_path),
        sizes: getImageSizes('portfolio'),
        alt: item.alt || item.title || gallery.name || 'Portfolio image',
      })),
    );

    const mediaItems = selectedMedia.map((file) => ({
      id: file.url,
      category: CATEGORY_LABELS[file.tag] || 'Other',
      src: getImageUrl(file.url),
      srcSet: getImageSrcSet(file.url),
      sizes: getImageSizes('portfolio'),
      alt: file.name || 'Portfolio image',
    }));

    if (selectedTokens.length === 0) {
      return [];
    }

    if (selectedGalleryIds.length > 0 && selectedMediaUrls.length > 0) {
      return [...galleryItems, ...mediaItems];
    }

    if (selectedGalleryIds.length > 0) {
      return galleryItems;
    }

    if (selectedMediaUrls.length > 0) {
      return mediaItems;
    }

    return [];
  }, [
    selectedGalleries,
    selectedMedia,
    selectedTokens.length,
    selectedGalleryIds.length,
    selectedMediaUrls.length,
  ]);

  const categories = useMemo(() => {
    const unique = new Set(portfolioItems.map((item) => item.category));
    const ordered = CATEGORY_ORDER.filter((category) => unique.has(category));
    const remaining = Array.from(unique).filter((category) => !CATEGORY_ORDER.includes(category));
    return ['All', ...ordered, ...remaining];
  }, [portfolioItems]);

  const filteredItems =
    filter === 'All' ? portfolioItems : portfolioItems.filter((item) => item.category === filter);

  // Keyboard navigation for lightbox (must be after filteredItems is declared)
  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIndex(null);
      else if (e.key === 'ArrowLeft')
        setSelectedIndex((i) =>
          i === null ? null : (i - 1 + filteredItems.length) % filteredItems.length,
        );
      else if (e.key === 'ArrowRight')
        setSelectedIndex((i) => (i === null ? null : (i + 1) % filteredItems.length));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIndex, filteredItems.length]);

  return (
    <div className="min-h-screen bg-[#080808] font-sans text-[#fcfcfc]">
      {page.hero_image && (
        <div
          data-page-hero
          className="relative h-[75vh] min-h-[560px] w-full overflow-hidden md:h-[90vh]"
        >
          <img
            src={getImageUrl(page.hero_image)}
            srcSet={getImageSrcSet(page.hero_image) || undefined}
            sizes={getImageSrcSet(page.hero_image) ? getImageSizes('hero') : undefined}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            alt={page.title || 'Portfolio'}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080808]/10 to-[#080808]/35" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#080808]/30 to-[#080808]" />

          <div className="absolute inset-0 flex items-end justify-center px-4 pb-28 text-center md:pb-32">
            <h1 className="display-page-title bg-gradient-to-r from-[#d4af37] via-[#f3eacb] to-[#c5a059] bg-clip-text font-display text-transparent drop-shadow-lg">
              {page.title || 'Portfolio'}
            </h1>
          </div>

          <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-4">
            <div className="relative h-12 w-[1px] overflow-hidden bg-white/20">
              <div className="landing-scroll-line absolute left-0 top-0 h-1/2 w-full bg-white" />
            </div>
            <p className="scroll-indicator-text font-display uppercase text-white/80">Scroll</p>
          </div>
        </div>
      )}

      {/* Quote section */}
      <section className="section-pad container mx-auto px-6 text-center md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-3xl"
        >
          <Quote className="mx-auto mb-6 block h-8 w-8 text-[#d4af37]/40" />
          <p className="display-lead font-serif italic text-white/80">
            &ldquo;Every frame tells a story, and every story is a piece of art.&rdquo;
          </p>
          <div className="mx-auto mt-8 h-[1px] w-16 bg-[#d4af37]/50" />
        </motion.div>
      </section>

      {/* Filter Bar */}
      <section className="container mx-auto mb-12 px-4">
        <div className="flex flex-wrap justify-center gap-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full border px-6 py-2 text-sm uppercase tracking-widest transition-all duration-300 ${
                filter === cat
                  ? 'border-[#d4af37] bg-[#d4af37] text-black'
                  : 'border-gray-800 bg-transparent text-gray-400 hover:border-[#d4af37]/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Masonry Grid */}
      <section className="container mx-auto px-4 pb-24">
        {filteredItems.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-sm border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#d4af37]">Portfolio</p>
            <p className="mt-4 text-base text-white/75">
              This page now shows only images selected manually in the CMS.
            </p>
          </div>
        ) : (
          <div className="columns-1 gap-6 space-y-6 md:columns-2 lg:columns-3">
            {filteredItems.map((item, idx) => (
              <div
                key={`${filter}-${item.id}`}
                className="group relative cursor-pointer break-inside-avoid overflow-hidden rounded-sm"
                onClick={() => setSelectedIndex(idx)}
              >
                <img
                  src={item.src}
                  srcSet={item.srcSet || undefined}
                  sizes={item.srcSet ? item.sizes : undefined}
                  alt={item.category}
                  loading="lazy"
                  decoding="async"
                  data-lightbox="off"
                  className="portfolio-grid-image h-auto w-full transition-all duration-500"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <Maximize2 className="mb-2 text-[#d4af37]" size={24} />
                  <span className="text-xs font-light uppercase tracking-[0.3em] text-white">
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && filteredItems[selectedIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
            onClick={() => setSelectedIndex(null)}
          >
            {/* Close */}
            <button
              className="absolute right-6 top-6 z-50 text-white/70 transition-colors hover:text-white"
              onClick={() => setSelectedIndex(null)}
            >
              <X size={32} strokeWidth={1.5} />
            </button>

            {/* Prev */}
            <button
              className="absolute left-4 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/55 text-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.24)] transition-all hover:border-[#d4af37] hover:bg-[#d4af37] hover:text-black"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((i) =>
                  i === null ? null : (i - 1 + filteredItems.length) % filteredItems.length,
                );
              }}
              aria-label="Previous image"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>

            {/* Next */}
            <button
              className="absolute right-4 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/55 text-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.24)] transition-all hover:border-[#d4af37] hover:bg-[#d4af37] hover:text-black"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((i) => (i === null ? null : (i + 1) % filteredItems.length));
              }}
              aria-label="Next image"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>

            {/* Counter + dash indicators */}
            <div className="absolute bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-3">
              {filteredItems.length <= 30 && (
                <div className="flex gap-2">
                  {filteredItems.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIndex(i);
                      }}
                      aria-label={`Image ${i + 1}`}
                      className={`h-[2px] transition-all duration-300 ${
                        i === selectedIndex
                          ? 'w-8 bg-[#d4af37]'
                          : 'w-4 bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              )}
              <div className="font-display text-xs tracking-[0.2em] text-white/70">
                <span className="text-[#d4af37]">{String(selectedIndex + 1).padStart(2, '0')}</span>
                {' / '}
                {String(filteredItems.length).padStart(2, '0')}
              </div>
            </div>

            {/* Image */}
            <motion.img
              key={selectedIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={filteredItems[selectedIndex].src}
              loading="eager"
              decoding="async"
              className="max-h-[85vh] max-w-[85vw] object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
