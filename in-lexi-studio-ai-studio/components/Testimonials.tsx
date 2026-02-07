import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    names: 'Chloe & Thomas',
    text: 'Alex was absolutely incredible – completely professional yet wonderfully non-obtrusive throughout our entire wedding day. He created such a calming atmosphere and brought an aura of peace that made everything feel natural and relaxed.',
    image:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 2,
    names: 'Sarah & James',
    text: 'The photo session went so smoothly. Instead of feeling stressed or posed, we found ourselves simply enjoying the moment while Alex captured everything beautifully. His gentle approach made us forget we were even being photographed.',
    image:
      'https://images.unsplash.com/photo-1522673607200-1645062cd495?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 3,
    names: 'Emily & Michael',
    text: "Beyond being incredibly talented, Alex is just a genuinely wonderful person. His warmth, kindness, and passion for helping others through creativity and connection has been so inspiring to us personally. Thank you so much, Alex – we can't express how grateful we are.",
    image:
      'https://images.unsplash.com/photo-1621621667797-e06afc21085c?q=80&w=1000&auto=format&fit=crop',
  },
];

export const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="relative overflow-hidden bg-[#151c19] py-24 text-white md:py-32">
      {/* Decorative Circles mimicking original design */}
      <div className="pointer-events-none absolute left-0 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[700px] w-[700px] translate-x-1/3 translate-y-1/3 rounded-full border border-white/5" />

      <div className="container relative z-10 mx-auto px-6 md:px-12">
        <div className="flex flex-col items-center gap-12 md:flex-row md:gap-24">
          {/* Left: Image Display */}
          <div className="relative h-[400px] w-full md:h-[600px] md:w-1/2">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonials[currentIndex].id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="relative h-full w-full"
              >
                <img
                  src={testimonials[currentIndex].image}
                  alt={testimonials[currentIndex].names}
                  className="h-full w-full object-cover shadow-2xl"
                />
                {/* Overlay Frame */}
                <div className="pointer-events-none absolute inset-0 -translate-x-4 -translate-y-4 border border-gold/30 md:-translate-x-8 md:-translate-y-8" />
              </motion.div>
            </AnimatePresence>

            {/* Mobile Controls */}
            <div className="mt-8 flex justify-center gap-6 md:hidden">
              <button
                onClick={prevSlide}
                className="rounded-full border border-white/20 p-3 transition-all hover:border-gold hover:bg-gold"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextSlide}
                className="rounded-full border border-white/20 p-3 transition-all hover:border-gold hover:bg-gold"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Right: Text Content */}
          <div className="w-full md:w-1/2">
            <div className="mb-12">
              <h2 className="font-display text-4xl leading-tight md:text-5xl">
                Love Stories <br />
                <span className="font-serif italic text-gold">from Past Clients</span>
              </h2>
            </div>

            <div className="relative min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonials[currentIndex].id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8"
                >
                  <Quote className="mb-4 h-12 w-12 text-gold/30" />

                  <p className="font-serif text-xl italic leading-relaxed text-gray-200 md:text-2xl">
                    "{testimonials[currentIndex].text}"
                  </p>

                  <div>
                    <h4 className="font-display text-lg uppercase tracking-widest text-gold">
                      {testimonials[currentIndex].names}
                    </h4>
                    <div className="mt-4 h-[1px] w-12 bg-white/20" />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop Controls */}
            <div className="mt-8 hidden gap-4 md:flex">
              <button
                onClick={prevSlide}
                className="group flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-white"
              >
                <span className="rounded-full border border-white/10 p-3 transition-colors group-hover:border-gold">
                  <ChevronLeft size={16} />
                </span>
                Prev
              </button>
              <button
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
