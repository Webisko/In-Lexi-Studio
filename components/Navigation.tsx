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
      <nav className={`fixed top-0 left-0 right-0 z-50 px-8 py-6 transition-all duration-500 ${isScrolled ? 'bg-dark-bg/90 backdrop-blur-md py-4' : 'bg-transparent'}`}>
        <div className="flex justify-between items-center w-full">
          {/* Left: ALEX */}
          <div className="w-1/3 flex justify-start">
             <span className="text-white font-display text-sm tracking-[0.2em] hover:text-gold transition-colors cursor-pointer uppercase">
               ALEX
             </span>
          </div>

          {/* Center: IN LEXI STUDIO (Logo Text) */}
          <div className="w-1/3 flex justify-center">
            <span className={`font-display text-white tracking-widest text-lg md:text-xl transition-all duration-500 ${isScrolled ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
              IN LEXI STUDIO
            </span>
          </div>

          {/* Right: GET IN TOUCH */}
          <div className="w-1/3 flex justify-end">
            <a href="#contact" className="text-white text-[10px] md:text-xs tracking-[0.2em] font-sans uppercase hover:text-gold transition-colors border-b border-transparent hover:border-gold pb-1">
              get in touch
            </a>
          </div>
        </div>
      </nav>

      {/* Full Screen Menu Overlay (Hidden logic kept for hamburger if needed later, but focusing on top nav per text) */}
    </>
  );
};