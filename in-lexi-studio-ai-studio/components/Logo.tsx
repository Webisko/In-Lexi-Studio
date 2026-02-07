import React from 'react';
import { motion } from 'framer-motion';

export const Logo: React.FC = () => {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center text-white">
      <motion.div
        initial={{ opacity: 0, rotate: -10 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="mb-8"
      >
        {/* Exact Triangle SVG Logic */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
          className="fill-transparent stroke-gold stroke-[1.5px] drop-shadow-2xl"
        >
          <path d="M50 10 L90 85 L10 85 Z" />
          {/* Inner geometric lines often found in such logos */}
          <path d="M50 25 L50 85" className="opacity-50" />
          <path d="M30 48 L70 48" className="opacity-50" />
          <circle cx="50" cy="55" r="35" className="stroke-[0.5px] opacity-30" />
        </svg>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, letterSpacing: '0.1em' }}
        animate={{ opacity: 1, letterSpacing: '0.25em' }}
        transition={{ duration: 1.2, delay: 0.5 }}
        className="mb-4 whitespace-nowrap text-center font-display text-4xl text-white md:text-6xl"
      >
        IN LEXI STUDIO
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="font-sans text-[10px] uppercase tracking-[0.4em] text-gold md:text-[11px]"
      >
        Adhere Arête Anytime
      </motion.p>
    </div>
  );
};
