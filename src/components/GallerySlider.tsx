import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { currentCategory, type GalleryCategory } from '../store/galleryStore';
import { mockData } from '../lib/mockData';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const GallerySlider: React.FC = () => {
    const category = useStore(currentCategory);
    const [images, setImages] = useState(mockData.gallery[category]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Update images when category changes
    useEffect(() => {
        setImages(mockData.gallery[category]);
        setCurrentIndex(0); // Reset to start
    }, [category]);

    // Autoplay Logic
    useEffect(() => {
        if (isHovered) {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        } else {
            autoPlayRef.current = setInterval(() => {
                nextSlide();
            }, 5000);
        }
        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [isHovered, images.length, currentIndex]); // depend on currentIndex to ensure closure is fresh if needed, though functional update handles it

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    // Calculate visible images (desktop 4)
    // We need to handle wrapping logic for infinite-like feel or just simple sliding window.
    // For a simple slider showing 4 items, let's just slice. If we near end, we wrap around.
    // However, user said "slider showing 4 images".
    // To make it truly infinite and smooth, we usually simply shift the index.

    // Let's assume we show 4 items starting from currentIndex.
    const getVisibleImages = () => {
        const visible = [];
        for (let i = 0; i < 4; i++) {
            visible.push(images[(currentIndex + i) % images.length]);
        }
        return visible;
    };

    const visibleImages = getVisibleImages();

    return (
        <div id="gallery" className="w-full h-[75vh] bg-dark-bg relative flex flex-col items-center justify-center overflow-hidden">

            <div
                className="w-full h-full relative"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Images Container - Full Width */}
                <div className="w-full h-full flex">
                    <AnimatePresence mode="popLayout">
                        {visibleImages.map((img, i) => (
                            <motion.div
                                key={`${img.id}-${i}`}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.8, ease: "easeInOut" }}
                                className="w-1/4 h-full relative group cursor-pointer"
                            >
                                <img
                                    src={img.src}
                                    alt={img.alt}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Dynamic CTA Button Overlay */}
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-20">
                    <a href={`${import.meta.env.BASE_URL}${category}`} className="bg-white text-dark-bg px-8 py-3 rounded-full flex items-center gap-2 hover:bg-gold hover:text-white transition-all duration-300 shadow-xl">
                        <span className="font-display tracking-[0.2em] text-xs uppercase">More about</span>
                        <span className="font-display tracking-[0.2em] text-xs uppercase font-bold text-gold hover:text-white transition-colors">{category}</span>
                    </a>
                </div>

                {/* Prev Button Overlay */}
                <button
                    onClick={prevSlide}
                    className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 z-20 mix-blend-difference"
                >
                    <ChevronLeft size={48} strokeWidth={1} />
                </button>

                {/* Next Button Overlay */}
                <button
                    onClick={nextSlide}
                    className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 z-20 mix-blend-difference"
                >
                    <ChevronRight size={48} strokeWidth={1} />
                </button>
            </div>
        </div>
    );
};
