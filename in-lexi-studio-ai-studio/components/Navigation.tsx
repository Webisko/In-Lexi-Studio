import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 px-8 py-6 transition-all duration-500 ${isScrolled ? 'bg-dark-bg/90 py-4 backdrop-blur-md' : 'bg-transparent'}`}
      >
        <div className="flex w-full items-center justify-between">
          {/* Left: ALEX */}
          <div className="flex w-1/3 justify-start">
            <span className="cursor-pointer font-display text-sm uppercase tracking-[0.2em] text-white transition-colors hover:text-gold">
              ALEX
            </span>
          </div>

          {/* Center: IN LEXI STUDIO (Logo Text) */}
          <div className="flex w-1/3 justify-center">
            <span
              className={`font-display text-lg tracking-widest text-white transition-all duration-500 md:text-xl ${isScrolled ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}
            >
              IN LEXI STUDIO
            </span>
          </div>

          {/* Right: GET IN TOUCH */}
          <div className="flex w-1/3 justify-end">
            <a
              href="#contact"
              className="border-b border-transparent pb-1 font-sans text-[10px] uppercase tracking-[0.2em] text-white transition-colors hover:border-gold hover:text-gold md:text-xs"
            >
              get in touch
            </a>
          </div>
        </div>
      </nav>

      {/* Full Screen Menu Overlay (Hidden logic kept for hamburger if needed later, but focusing on top nav per text) */}
    </>
  );
};
