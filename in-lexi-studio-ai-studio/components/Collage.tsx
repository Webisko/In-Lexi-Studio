import React from 'react';
import { motion } from 'framer-motion';

const images = [
  'https://images.unsplash.com/photo-1520854222323-2742994a539b?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1529636721198-60318ae738cd?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1510076857177-7470076d4098?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511285560982-1351cdeb9821?q=80&w=600&auto=format&fit=crop',
];

export const Collage: React.FC = () => {
  return (
    <section className="overflow-hidden bg-white px-4 py-24">
      <div className="container mx-auto">
        <div className="mb-16 flex flex-col items-center">
          <span className="mb-2 font-sans text-xs uppercase tracking-[0.3em] text-gray-500">
            Portfolio
          </span>
          <h2 className="font-display text-3xl text-black md:text-5xl">Selected Works</h2>
        </div>

        <div className="columns-1 gap-4 space-y-4 md:columns-3 lg:columns-4">
          {images.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              viewport={{ once: true }}
              className="break-inside-avoid"
            >
              <div className="group relative overflow-hidden">
                <img
                  src={src}
                  alt={`Gallery item ${i}`}
                  className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/20" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 flex justify-center">
          <button className="bg-black px-10 py-4 font-sans text-xs uppercase tracking-[0.25em] text-white transition-colors hover:bg-gold">
            View Full Gallery
          </button>
        </div>
      </div>
    </section>
  );
};
