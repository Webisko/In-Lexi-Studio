import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { setCategory, type GalleryCategory } from '../store/galleryStore';

export const Hero: React.FC = () => {
  const { scrollY } = useScroll();

  // Transform logic for the central graphic
  // Shrink slightly and fade out as we scroll down
  const graphicScale = useTransform(scrollY, [0, 300], [1, 0.5]);
  const graphicOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const graphicY = useTransform(scrollY, [0, 300], [0, -50]); // Move up slightly as it fades

  // Scroll indicator opacity
  const scrollIndicatorOpacity = useTransform(scrollY, [0, 100], [1, 0]);

  const handleCategoryClick = (e: React.MouseEvent, category: GalleryCategory) => {
    e.preventDefault();
    setCategory(category);
    const gallerySection = document.getElementById('gallery');
    if (gallerySection) {
      gallerySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative h-[120vh] w-full bg-dark-bg">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://inlexistudio.com/wp-content/uploads/ILS-68-glowna.webp"
          alt="Hero Background"
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Top Section (0-100vh) - Graphic & Scroll Indicator */}
      <div className="pointer-events-none relative z-10 flex h-[100vh] w-full flex-col items-center justify-center">
        {/* Central Graphic */}
        <motion.div
          style={{
            scale: graphicScale,
            opacity: graphicOpacity,
            y: graphicY,
          }}
          transition={{ duration: 0 }}
          className="flex w-full max-w-2xl items-center justify-center px-4"
        >
          <img
            src="https://inlexistudio.com/wp-content/uploads/In-Lexi-Studio-1000X1000-5.webp"
            alt="In Lexi Studio"
            className="h-auto w-full object-contain drop-shadow-2xl md:w-[80%]"
          />
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          style={{ opacity: scrollIndicatorOpacity }}
          className="absolute bottom-8 flex flex-col items-center gap-4"
        >
          <div className="relative h-12 w-[1px] overflow-hidden bg-white/20">
            <motion.div
              className="absolute left-0 top-0 h-1/2 w-full bg-white"
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <p className="font-display text-[10px] uppercase tracking-[0.3em] text-white/80">
            Scroll
          </p>
        </motion.div>
      </div>

      {/* Bottom Section (100vh-120vh) - Navigation Links */}
      <div className="relative z-10 flex h-[20vh] w-full items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-8 md:flex-row md:gap-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8 }}
        >
          {['WEDDING', 'PORTRAIT', 'PRODUCT'].map((item) => (
            <a
              key={item}
              href={`#gallery`}
              onClick={(e) => handleCategoryClick(e, item.toLowerCase() as GalleryCategory)}
              onMouseEnter={() => setCategory(item.toLowerCase() as GalleryCategory)}
              className="group pointer-events-auto relative cursor-pointer font-display text-xl uppercase tracking-[0.2em] text-white transition-all duration-300 hover:text-gold md:text-2xl"
            >
              {item}
              <span className="absolute -bottom-2 left-0 h-[1px] w-0 bg-gold transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
