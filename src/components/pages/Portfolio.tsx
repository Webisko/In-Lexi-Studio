import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';
import type { Gallery, Page } from '../../lib/api';
import { getImageSizes, getImageSrcSet, getImageUrl } from '../../lib/api';

interface Props {
  page: Page;
  galleries?: Gallery[];
}

const CATEGORY_LABELS: Record<string, string> = {
  wedding: 'Wedding',
  portrait: 'Portrait',
  product: 'Product',
};

export default function Portfolio({ page, galleries = [] }: Props) {
  const [filter, setFilter] = useState('All');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const selectedGalleryIds = useMemo(
    () => (page.portfolio_gallery_ids || []).map((id) => Number(id)),
    [page.portfolio_gallery_ids],
  );
  const selectedGalleries = useMemo(() => {
    if (!selectedGalleryIds.length) return galleries;
    const map = new Map(galleries.map((gallery) => [gallery.id, gallery]));
    return selectedGalleryIds.map((id) => map.get(id)).filter(Boolean) as Gallery[];
  }, [galleries, selectedGalleryIds]);

  const portfolioItems = useMemo(() => {
    return selectedGalleries.flatMap((gallery) =>
      (gallery.items || []).map((item) => ({
        id: `${gallery.id}-${item.id}`,
        category: CATEGORY_LABELS[gallery.category] || gallery.category,
        src: getImageUrl(item.image_path),
        srcSet: getImageSrcSet(item.image_path),
        sizes: getImageSizes('gallery'),
        alt: item.alt || item.title || gallery.name || 'Portfolio image',
      })),
    );
  }, [selectedGalleries]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(portfolioItems.map((item) => item.category)));
    return ['All', ...unique];
  }, [portfolioItems]);

  const filteredItems =
    filter === 'All' ? portfolioItems : portfolioItems.filter((item) => item.category === filter);

  return (
    <div className="min-h-screen bg-[#080808] font-sans text-[#fcfcfc]">
      {/* Header section */}
      <section className="container mx-auto px-4 pb-16 pt-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="mb-4 bg-gradient-to-r from-[#d4af37] via-[#f3eacb] to-[#c5a059] bg-clip-text font-display text-4xl text-transparent md:text-6xl">
            {page.title || 'My Artwork'}
          </h1>
          <div className="mx-auto mb-8 h-[1px] w-24 bg-[#d4af37]" />
          <p className="mx-auto max-w-2xl text-lg italic text-gray-400">
            "Every frame tells a story, and every story is a piece of art."
          </p>
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
        <motion.div layout className="columns-1 gap-6 space-y-6 md:columns-2 lg:columns-3">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="group relative cursor-pointer break-inside-avoid overflow-hidden rounded-sm"
                onClick={() => setSelectedImage(item.src)}
              >
                <img
                  src={item.src}
                  srcSet={item.srcSet || undefined}
                  sizes={item.srcSet ? item.sizes : undefined}
                  alt={item.category}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-full transform grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <Maximize2 className="mb-2 text-[#d4af37]" size={24} />
                  <span className="text-xs font-light uppercase tracking-[0.3em] text-white">
                    {item.category}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute right-8 top-8 text-white transition-colors hover:text-[#d4af37]"
              onClick={() => setSelectedImage(null)}
            >
              <X size={40} strokeWidth={1} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage}
              loading="eager"
              decoding="async"
              className="max-h-full max-w-full object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
