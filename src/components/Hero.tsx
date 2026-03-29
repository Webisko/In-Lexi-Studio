import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { currentCategory, setCategory, type GalleryCategory } from '../store/galleryStore';
import type { Page, Settings } from '../lib/api';
import { getImageSizes, getImageSrcSet, getImageUrl } from '../lib/api';

interface HeroProps {
  data?: Page | null;
  settings?: Settings | null;
}

export const Hero: React.FC<HeroProps> = ({ data, settings }) => {
  const { scrollY } = useScroll();
  const activeCategory = useStore(currentCategory);

  const bgImage = data?.hero_image
    ? getImageUrl(data.hero_image)
    : 'https://inlexistudio.com/wp-content/uploads/ILS-68-glowna.webp';
  const bgSrcSet = data?.hero_image ? getImageSrcSet(data.hero_image) : '';
  const bgSizes = bgSrcSet ? getImageSizes('hero') : undefined;

  // The global CMS settings are the single source of truth for the hero logo.
  const heroLogoSource = settings?.logo_path || data?.home_hero_logo || '';
  const heroLogo = heroLogoSource ? getImageUrl(heroLogoSource) : '';

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
  };

  return (
    <section
      data-page-hero
      className="relative min-h-[100svh] w-full bg-dark-bg md:h-[120vh] md:min-h-0"
    >
      {/* Background Image */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <img
          src={bgImage}
          srcSet={bgSrcSet || undefined}
          sizes={bgSizes}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          alt="Hero Background"
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Top Section (0-100vh) - Graphic & Scroll Indicator */}
      <div className="pointer-events-none relative z-10 flex h-[82svh] w-full flex-col items-center justify-center md:h-[100vh]">
        {/* Central Graphic */}
        <motion.div
          style={{
            scale: graphicScale,
            opacity: graphicOpacity,
            y: graphicY,
          }}
          transition={{ duration: 0 }}
          className="flex w-full max-w-[1400px] items-center justify-center px-4 sm:px-6"
        >
          {heroLogo ? (
            <img
              src={heroLogo}
              alt="In Lexi Studio"
              loading="eager"
              decoding="async"
              className="max-h-[48svh] w-[min(82vw,420px)] object-contain drop-shadow-2xl sm:max-h-[52svh] sm:w-[min(72vw,520px)] md:h-[52vh] md:max-h-[60vh] md:w-auto lg:h-[65vh] lg:max-h-[65vh]"
            />
          ) : null}
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          style={{ opacity: scrollIndicatorOpacity }}
          className="absolute bottom-6 flex flex-col items-center gap-3 md:bottom-8 md:gap-4"
        >
          <div className="relative h-12 w-[1px] overflow-hidden bg-white/20">
            <motion.div
              className="absolute left-0 top-0 h-1/2 w-full bg-white"
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <p className="scroll-indicator-text font-display uppercase text-white/80">Scroll</p>
        </motion.div>
      </div>

      {/* Bottom Section (100vh-120vh) - Navigation Links */}
      <div className="relative z-10 flex min-h-[18svh] w-full items-center justify-center px-4 pb-8 md:h-[20vh] md:min-h-0 md:px-0 md:pb-0">
        <motion.div
          className="flex w-full max-w-[240px] flex-col items-center gap-5 text-center md:w-auto md:max-w-none md:flex-row md:gap-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8 }}
        >
          {['WEDDING', 'PORTRAIT', 'PRODUCT'].map((item, index) => {
            const category = item.toLowerCase() as GalleryCategory;
            const isActive = activeCategory === category;
            
            const alignmentClass = index === 0 ? 'self-start md:self-auto' : index === 1 ? 'self-center md:self-auto' : 'self-end md:self-auto';

            return (
              <a
                key={item}
                href="#"
                onClick={(e) => handleCategoryClick(e, category)}
                onMouseEnter={() => setCategory(category)}
                className={`hero-category-link group pointer-events-auto relative cursor-pointer font-display uppercase transition-all duration-300 ${alignmentClass} ${
                  isActive ? '-translate-y-1 text-gold' : 'translate-y-0 text-white hover:text-gold'
                }`}
              >
                {item}
                <span
                  className={`absolute -bottom-2 left-0 h-[1px] bg-gold transition-all duration-300 ${
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </a>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
