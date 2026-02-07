import React from 'react';
import { Logo } from './Logo';
import { motion } from 'framer-motion';

export const Hero: React.FC = () => {
  const categories = [
    {
      title: 'WEDDING',
      img: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'PORTRAIT',
      img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'PRODUCT',
      img: 'https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?q=80&w=1000&auto=format&fit=crop',
    },
  ];

  return (
    <section className="relative flex min-h-screen w-full flex-col items-center bg-dark-bg">
      {/* Background Video/Image */}
      <div className="absolute inset-0 z-0 h-[70vh] md:h-[80vh]">
        <video autoPlay muted loop playsInline className="h-full w-full object-cover opacity-40">
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-bride-holding-wedding-bouquet-vertically-402-large.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-dark-bg" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex w-full flex-col items-center px-4 pb-12 pt-32">
        {/* Logo */}
        <div className="mb-12 scale-110 transform md:mb-20 md:scale-125">
          <Logo />
        </div>

        {/* Category Image Cards - Replacing simple text links */}
        <div className="mt-8 grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
          {categories.map((item, i) => (
            <motion.a
              key={item.title}
              href={`#${item.title.toLowerCase()}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 + i * 0.2 }}
              className="group relative block h-[400px] cursor-pointer overflow-hidden md:h-[500px]"
            >
              {/* Image */}
              <div className="absolute inset-0 bg-gray-900">
                <img
                  src={item.img}
                  alt={item.title}
                  className="h-full w-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-110 group-hover:opacity-100"
                />
              </div>

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-black/20 transition-all duration-500 group-hover:bg-black/0" />

              {/* Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-12">
                <span className="relative z-10 font-display text-2xl uppercase tracking-[0.2em] text-white drop-shadow-lg transition-colors duration-300 group-hover:text-gold">
                  {item.title}
                </span>
                <div className="mt-4 h-[1px] w-0 bg-gold transition-all duration-500 group-hover:w-16" />
              </div>
            </motion.a>
          ))}
        </div>

        {/* Scroll Indicator / Bottom Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="mt-16 md:mt-24"
        >
          <button className="rounded-full border border-white/20 bg-transparent px-8 py-3 text-[10px] uppercase tracking-[0.25em] text-white/70 transition-all duration-300 hover:border-white hover:bg-white hover:text-black">
            more about wedding
          </button>
        </motion.div>
      </div>
    </section>
  );
};
