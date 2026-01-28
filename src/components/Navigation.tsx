import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  // Opacity for the "IN LEXI STUDIO" text in nav
  const logoTextOpacity = useTransform(scrollY, [300, 500], [0, 1]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 px-8 py-6 transition-all duration-500 ${isScrolled ? 'bg-dark-bg/70 backdrop-blur-md py-4' : 'bg-transparent'}`}>
        <div className="flex justify-between items-center w-full">
          {/* Left: Custom Menu Icon */}
          <div className="w-1/3 flex justify-start">
            <button className="group relative w-10 h-10 flex items-center justify-center focus:outline-none">
              <div className="flex flex-col items-start gap-[6px] group-hover:gap-[8px] transition-all duration-300">
                <span className="w-8 h-[1px] bg-white group-hover:bg-gold transition-all duration-300 origin-right"></span>
                <span className="w-5 h-[1px] bg-white group-hover:w-8 group-hover:bg-gold transition-all duration-300 delay-75"></span>
                <span className="w-8 h-[1px] bg-white group-hover:bg-gold transition-all duration-300 delay-150 origin-right"></span>
              </div>
            </button>
          </div>

          {/* Center: IN LEXI STUDIO (Logo Text) */}
          <div className="w-1/3 flex justify-center">
            <motion.span
              style={{ opacity: logoTextOpacity }}
              className="font-display text-white tracking-widest text-lg md:text-xl"
            >
              IN LEXI STUDIO
            </motion.span>
          </div>

          {/* Right: GET IN TOUCH */}
          <div className="w-1/3 flex justify-end">
            <a href="#contact" className="text-white text-[10px] md:text-xs tracking-[0.2em] font-sans uppercase hover:text-gold transition-colors border-b border-transparent hover:border-gold pb-1">
              get in touch
            </a>
          </div>
        </div>
      </nav>

      {/* Full Screen Menu Overlay (Hidden logic) */}
    </>
  );
};