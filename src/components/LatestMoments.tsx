import React from 'react';
import { motion } from 'framer-motion';

interface Moment {
  id: number;
  title: string;
  image: string;
}

const moments: Moment[] = [
  {
    id: 1,
    title: 'Claire & Ryan',
    image:
      'https://images.unsplash.com/photo-1621621667797-e06afc21085c?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Alice & Alex',
    image:
      'https://images.unsplash.com/photo-1511285560982-1351cdeb9821?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Clair & John',
    image:
      'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 4,
    title: 'Chloe & Thomas',
    image:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 5,
    title: 'Lesleyann & Colin',
    image:
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 6,
    title: 'BillyJo & Martin',
    image:
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop',
  },
];

export const LatestMoments: React.FC = () => {
  return (
    <section className="bg-white px-4 py-24 md:px-12 md:py-32">
      <div className="mb-20 flex flex-col items-center">
        <h2 className="text-center font-display text-4xl leading-none text-black md:text-6xl">
          LATEST <br /> MOMENTS
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {moments.map((moment, index) => (
          <motion.div
            key={moment.id}
            className="group relative cursor-pointer"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.8 }}
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition-all duration-500 group-hover:bg-black/40">
                <span className="translate-y-4 transform border border-white px-6 py-2 text-[10px] uppercase tracking-widest text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  DISCOVER
                </span>
              </div>
              <img
                src={moment.image}
                alt={moment.title}
                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            </div>

            <div className="mt-4 text-center">
              <h3 className="font-serif text-2xl italic text-gray-800">{moment.title}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Decorative End Mark */}
      <div className="mt-24 flex justify-center">
        <span className="font-display text-4xl text-gold/50">ILS</span>
      </div>
    </section>
  );
};
