import React from 'react';
import { Logo } from './Logo';
import { motion } from 'framer-motion';

export const Hero: React.FC = () => {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-dark-bg flex flex-col justify-center items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <video 
           autoPlay 
           muted 
           loop 
           playsInline
           className="w-full h-full object-cover opacity-50"
        >
            {/* Placeholder for video, using static image fallback visually if video fails */}
            <source src="https://assets.mixkit.co/videos/preview/mixkit-bride-holding-wedding-bouquet-vertically-402-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-4 pt-20">
        
        {/* Logo Placeholder "In Lexi Studio 1000X1000" */}
        <div className="mb-16 transform scale-110 md:scale-125">
             <Logo />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex flex-col items-center gap-10"
        >
          {/* Main Titles - Links */}
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-16">
            {['WEDDING', 'PORTRAIT', 'PRODUCT'].map((item, i) => (
              <React.Fragment key={item}>
                <a 
                  href={`#${item.toLowerCase()}`}
                  className="text-white font-display text-xl md:text-2xl tracking-[0.2em] hover:text-gold transition-all duration-500 uppercase"
                >
                  {item}
                </a>
              </React.Fragment>
            ))}
          </div>
        </motion.div>
        
        {/* Bottom Button */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-16 md:bottom-24"
        >
             <button className="bg-transparent border border-white/30 px-8 py-3 rounded-full text-white text-[10px] tracking-[0.25em] uppercase hover:bg-white hover:text-black hover:border-white transition-all duration-300">
                more about wedding
             </button>
        </motion.div>
      </div>
    </section>
  );
};