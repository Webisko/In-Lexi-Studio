import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxProps {
  images: Array<{ id: number; src: string; alt: string }>;
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        onNavigate((currentIndex - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight') {
        onNavigate((currentIndex + 1) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

  const handlePrev = () => {
    onNavigate((currentIndex - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    onNavigate((currentIndex + 1) % images.length);
  };

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 z-50 text-white/70 transition-colors hover:text-white"
          >
            <X size={32} strokeWidth={1.5} />
          </button>

          {/* Counter + dash indicators */}
          <div className="absolute bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-3">
            {images.length <= 30 && (
              <div className="flex gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(i);
                    }}
                    aria-label={`Image ${i + 1}`}
                    className={`h-[2px] transition-all duration-300 ${
                      i === currentIndex ? 'w-8 bg-[#d4af37]' : 'w-4 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}
            <div className="font-display text-xs tracking-[0.2em] text-white/70">
              <span className="text-[#d4af37]">{String(currentIndex + 1).padStart(2, '0')}</span>
              {' / '}
              {String(images.length).padStart(2, '0')}
            </div>
          </div>

          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/55 text-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.24)] transition-all hover:border-[#d4af37] hover:bg-[#d4af37] hover:text-black"
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next image"
            className="absolute right-4 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/55 text-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.24)] transition-all hover:border-[#d4af37] hover:bg-[#d4af37] hover:text-black"
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>

          {/* Image */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex max-h-[90vh] max-w-[90vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[currentIndex].src}
              alt={images[currentIndex].alt}
              loading="eager"
              decoding="async"
              data-lightbox="off"
              className="max-h-[90vh] max-w-full object-contain"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
