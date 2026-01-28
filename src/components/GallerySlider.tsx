import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { currentCategory, type GalleryCategory } from '../store/galleryStore';
import { mockData } from '../lib/mockData';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Lightbox } from './Lightbox';

export const GallerySlider: React.FC = () => {
    const category = useStore(currentCategory);
    const originalImages = mockData.gallery[category];
    const [currentIndex, setCurrentIndex] = useState(originalImages.length);
    const [isHovered, setIsHovered] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const dragStartX = useRef(0);
    const isDragging = useRef(false);

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
                setCurrentIndex(currentIndex - originalImages.length);
            } else if (currentIndex < originalImages.length) {
                setCurrentIndex(currentIndex + originalImages.length);
            }
        }
    }, [currentIndex, isAnimating, originalImages.length]);

    // Autoplay Logic
    useEffect(() => {
        if (autoPlayRef.current) {
            clearInterval(autoPlayRef.current);
        }

        if (!isHovered && !lightboxOpen) {
            autoPlayRef.current = setInterval(() => {
                setIsAnimating(true);
                setCurrentIndex((prev) => prev + 1);
            }, 5000);
        }

        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [isHovered, lightboxOpen]);

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

    const handleDragStart = (event: any, info: any) => {
        isDragging.current = true;
        dragStartX.current = info.point.x;
    };

    const handleDragEnd = (event: any, info: any) => {
        const threshold = 50;
        const dragDistance = Math.abs(info.point.x - dragStartX.current);

        if (dragDistance > threshold) {
            if (info.offset.x < -threshold) {
                nextSlide();
            } else if (info.offset.x > threshold) {
                prevSlide();
            }
        }

        setTimeout(() => {
            isDragging.current = false;
        }, 100);
    };

    const handleImageClick = (index: number) => {
        if (isDragging.current) return;

        // Calculate the actual image index in the original array
        const actualIndex = index % originalImages.length;
        setLightboxIndex(actualIndex);
        setLightboxOpen(true);
    };

    const handleLightboxNavigate = (newIndex: number) => {
        setLightboxIndex(newIndex);
    };

    return (
        <>
            <div id="gallery" className="w-full h-[75vh] bg-dark-bg relative flex flex-col items-center justify-center overflow-hidden">

                <div
                    className="w-full h-full relative"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Images Strip */}
                    <motion.div
                        className="flex h-full cursor-grab active:cursor-grabbing"
                        animate={{ x: `-${currentIndex * 25}vw` }}
                        transition={isAnimating ? { type: "spring", stiffness: 150, damping: 20 } : { duration: 0 }}
                        onAnimationComplete={() => setIsAnimating(false)}
                        drag="x"
                        dragElastic={0.2}
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        {images.map((img, i) => (
                            <div
                                key={`${img.id}-${i}`}
                                className="w-[25vw] h-full flex-shrink-0 relative group cursor-pointer"
                                onClick={() => handleImageClick(i)}
                            >
                                <img
                                    src={img.src}
                                    alt={img.alt}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                                    draggable={false}
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />
                            </div>
                        ))}
                    </motion.div>

                    {/* Dynamic CTA Button Overlay */}
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto">
                        <a href={`${import.meta.env.BASE_URL}${category}`} className="bg-white text-dark-bg px-8 py-3 rounded-full flex items-center gap-2 hover:bg-gold hover:text-white transition-all duration-300 shadow-xl">
                            <span className="font-display tracking-[0.2em] text-xs uppercase">More about</span>
                            <span className="font-display tracking-[0.2em] text-xs uppercase font-bold text-gold hover:text-white transition-colors">{category}</span>
                        </a>
                    </div>

                    {/* Prev Button Overlay */}
                    <button
                        onClick={prevSlide}
                        className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 z-20 mix-blend-difference pointer-events-auto"
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
                        className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 z-20 mix-blend-difference pointer-events-auto"
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

            {/* Lightbox */}
            <Lightbox
                images={originalImages}
                currentIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                onNavigate={handleLightboxNavigate}
            />
        </>
    );
};
