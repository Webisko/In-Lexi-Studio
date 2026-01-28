import React, { useEffect } from 'react';
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
    onNavigate
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

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
                    onClick={onClose}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-50"
                    >
                        <X size={32} strokeWidth={1.5} />
                    </button>

                    {/* Image Counter */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/70 font-display tracking-widest text-sm">
                        {currentIndex + 1} / {images.length}
                    </div>

                    {/* Previous Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePrev();
                        }}
                        className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors z-50"
                    >
                        <ChevronLeft size={48} strokeWidth={1} />
                    </button>

                    {/* Next Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNext();
                        }}
                        className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors z-50"
                    >
                        <ChevronRight size={48} strokeWidth={1} />
                    </button>

                    {/* Image */}
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={images[currentIndex].src}
                            alt={images[currentIndex].alt}
                            className="max-w-full max-h-[90vh] object-contain"
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
