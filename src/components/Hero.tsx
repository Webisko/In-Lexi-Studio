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
    <section className="relative w-full h-[120vh] bg-dark-bg">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://inlexistudio.com/wp-content/uploads/ILS-68-glowna.webp"
          alt="Hero Background"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Top Section (0-100vh) - Graphic & Scroll Indicator */}
      <div className="relative z-10 w-full h-[100vh] flex flex-col items-center justify-center pointer-events-none">

        {/* Central Graphic */}
        <motion.div
          style={{
            scale: graphicScale,
            opacity: graphicOpacity,
            y: graphicY
          }}
          transition={{ duration: 0 }}
          className="w-full max-w-2xl px-4 flex justify-center items-center"
        >
          <img
            src="https://inlexistudio.com/wp-content/uploads/In-Lexi-Studio-1000X1000-5.webp"
            alt="In Lexi Studio"
            className="w-full md:w-[80%] h-auto object-contain drop-shadow-2xl"
          />
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          style={{ opacity: scrollIndicatorOpacity }}
          className="absolute bottom-8 flex flex-col items-center gap-4"
        >
          <div className="w-[1px] h-12 bg-white/20 relative overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 w-full h-1/2 bg-white"
              animate={{ y: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-white/80 font-display tracking-[0.3em] text-[10px] uppercase">Scroll</p>
        </motion.div>
      </div>

      {/* Bottom Section (100vh-120vh) - Navigation Links */}
      <div className="relative z-10 w-full h-[20vh] flex items-center justify-center">
        <motion.div
          className="flex flex-col md:flex-row items-center gap-8 md:gap-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
        >
          {['WEDDING', 'PORTRAIT', 'PRODUCT'].map((item) => (
            <a
              key={item}
              href={`#gallery`}
              onClick={(e) => handleCategoryClick(e, item.toLowerCase() as GalleryCategory)}
              onMouseEnter={() => setCategory(item.toLowerCase() as GalleryCategory)}
              className="text-white font-display text-xl md:text-2xl tracking-[0.2em] hover:text-gold transition-all duration-300 uppercase relative group pointer-events-auto cursor-pointer"
            >
              {item}
              <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};