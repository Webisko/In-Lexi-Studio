import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { currentCategory, type GalleryCategory } from '../store/galleryStore';
import { mockData } from '../lib/mockData';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const GallerySlider: React.FC = () => {
    const category = useStore(currentCategory);
    const originalImages = mockData.gallery[category];
    const [currentIndex, setCurrentIndex] = useState(originalImages.length);
    const [isHovered, setIsHovered] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Triple the images to allow seamless infinite scrolling
    const images = [...originalImages, ...originalImages, ...originalImages];

    // Update images and reset index when category changes
    useEffect(() => {
        setCurrentIndex(originalImages.length);
    }, [category, originalImages.length]);

    // Handle the "snap" for infinite loop
    useEffect(() => {
        if (!isAnimating) {
            if (currentIndex >= originalImages.length * 2) {
                // Instantly jump back to the middle set
                setCurrentIndex(currentIndex - originalImages.length);
            } else if (currentIndex < originalImages.length) {
                // Instantly jump forward to the middle set
                setCurrentIndex(currentIndex + originalImages.length);
            }
        }
    }, [currentIndex, isAnimating, originalImages.length]);

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
    }, [isHovered, originalImages.length, currentIndex]);

    const nextSlide = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentIndex((prev) => prev + 1);
    };

    const prevSlide = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentIndex((prev) => prev - 1);
    };

    const handleDragEnd = (event: any, info: any) => {
        const threshold = 50;
        if (info.offset.x < -threshold) {
            nextSlide();
        } else if (info.offset.x > threshold) {
            prevSlide();
        }
    };

    return (
        <div id="gallery" className="w-full h-[75vh] bg-dark-bg relative flex flex-col items-center justify-center overflow-hidden">

            <div
                className="w-full h-full relative"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Images Strip */}
                <motion.div
                    className="flex h-full"
                    animate={{ x: `-${currentIndex * 25}vw` }}
                    transition={isAnimating ? { type: "spring", stiffness: 150, damping: 20 } : { duration: 0 }}
                    onAnimationComplete={() => setIsAnimating(false)}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragStart={() => setIsAnimating(true)}
                    onDragEnd={handleDragEnd}
                    style={{ width: `${images.length * 25}%` }}
                >
                    {images.map((img, i) => (
                        <div
                            key={`${img.id}-${i}`}
                            className="w-[25vw] h-full flex-shrink-0 relative group cursor-grab active:cursor-grabbing"
                        >
                            <img
                                src={img.src}
                                alt={img.alt}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />
                        </div>
                    ))}
                </motion.div>

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
                    <motion.div
                        animate={{ x: [-5, 0, -5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <ChevronLeft size={48} strokeWidth={1} />
                    </motion.div>
                </button>

                {/* Next Button Overlay */}
                <button
                    onClick={nextSlide}
                    className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 z-20 mix-blend-difference"
                >
                    <motion.div
                        animate={{ x: [5, 0, 5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <ChevronRight size={48} strokeWidth={1} />
                    </motion.div>
                </button>
            </div>
        </div>
    );
};
