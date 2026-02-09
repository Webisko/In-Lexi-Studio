import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

import type { Testimonial } from '../lib/api';
import { getImageUrl } from '../lib/api';

interface TestimonialsProps {
  data: Testimonial[];
}

export const Testimonials: React.FC<TestimonialsProps> = ({ data }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use passed data or empty array
  const items =
    data && data.length > 0
      ? data
      : [
          {
            id: 0,
            author: 'No Testimonials Yet',
            content: 'Be the first to leave a review!',
            rating: 5,
          },
        ];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const current = items[currentIndex];
  // Fallback images since API doesn't support them yet
  const fallbackImage =
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1000&auto=format&fit=crop';
  const currentImage = current.avatar_image ? getImageUrl(current.avatar_image) : fallbackImage;

  return (
    <section className="relative overflow-hidden bg-[#151c19] py-24 text-white md:py-32">
      {/* ... keeping existing layout but using dynamic data ... */}
      <div className="pointer-events-none absolute left-0 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[700px] w-[700px] translate-x-1/3 translate-y-1/3 rounded-full border border-white/5" />

      <div className="container relative z-10 mx-auto px-6 md:px-12">
        <div className="flex flex-col items-center gap-12 md:flex-row md:gap-24">
          <div className="relative h-[400px] w-full md:h-[600px] md:w-1/2">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="relative h-full w-full"
              >
                <img
                  src={currentImage}
                  alt={current.author}
                  className="h-full w-full object-cover shadow-2xl"
                />
                <div className="pointer-events-none absolute inset-0 -translate-x-4 -translate-y-4 border border-gold/30 md:-translate-x-8 md:-translate-y-8" />
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex justify-center gap-6 md:hidden">
              <button
                type="button"
                onClick={prevSlide}
                className="rounded-full border border-white/20 p-3 transition-all hover:border-gold hover:bg-gold"
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="rounded-full border border-white/20 p-3 transition-all hover:border-gold hover:bg-gold"
                aria-label="Next testimonial"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="w-full md:w-1/2">
            <div className="mb-12">
              <h2 className="font-display text-4xl leading-tight md:text-5xl">
                Love Stories <br />
                <span className="font-serif italic text-gold">from Past Clients</span>
              </h2>
            </div>

            <div className="relative min-h-[300px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="space-y-8"
                >
                  <Quote className="mb-4 h-12 w-12 text-gold/30" />

                  <p className="font-serif text-xl italic leading-relaxed text-gray-200 md:text-2xl">
                    &ldquo;{current.content || '...'}&rdquo;
                  </p>

                  <div>
                    <h4 className="font-display text-lg uppercase tracking-widest text-gold">
                      {current.author}
                    </h4>
                    <div className="mt-4 h-[1px] w-12 bg-white/20" />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-8 hidden gap-4 md:flex">
              {/* ... navigation buttons ... */}
              <button
                type="button"
                onClick={prevSlide}
                className="group flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-white"
              >
                <span className="rounded-full border border-white/10 p-3 transition-colors group-hover:border-gold">
                  <ChevronLeft size={16} />
                </span>
                Prev
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="group flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-white"
              >
                Next
                <span className="rounded-full border border-white/10 p-3 transition-colors group-hover:border-gold">
                  <ChevronRight size={16} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
