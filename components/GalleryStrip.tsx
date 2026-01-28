import React from 'react';
import { motion } from 'framer-motion';

export const GalleryStrip: React.FC = () => {
  return (
    <section className="bg-white py-24 md:py-40 px-6 overflow-hidden">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row gap-16 md:gap-24 items-start">
            
            {/* Left Column: Welcome */}
            <div className="w-full md:w-1/3 sticky top-32">
                <motion.h2 
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="font-display text-5xl md:text-7xl leading-tight text-black"
                >
                    Welcome <br />
                    <span className="text-3xl md:text-4xl italic font-serif text-gray-500 block mt-2">to</span>
                    IN LEXI <br/> STUDIO
                </motion.h2>
                <div className="w-12 h-[1px] bg-gold mt-8 mb-8"></div>
            </div>

            {/* Right Column: Poetic Text */}
            <div className="w-full md:w-2/3">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <h3 className="font-sans text-lg md:text-xl font-bold tracking-widest uppercase leading-relaxed text-black">
                        MY PULSE QUICKENS.<br/>
                        ADRENALINE COURSES THROUGH MY BODY.<br/>
                        EVERY SENSE HEIGHTENED.
                    </h3>

                    <p className="font-serif text-xl md:text-2xl leading-loose text-gray-700">
                        I scan the scene, taking it all in: expressions, connections, raw emotion.
                        I witness joyful tears streaming down cheeks, spontaneous laughter erupting, and embraces that speak volumes without words.
                        People truly present for this single, precious day.
                        Souls living in the moment, leaving their worries behind.
                    </p>

                    <p className="font-serif text-xl md:text-2xl leading-loose text-gray-700">
                        This singular "now" becomes everything.<br/>
                        The past dissolves.<br/>
                        The future waits.<br/>
                        Only this perfect, fleeting instant matters - pure, unadulterated celebration of life and love.
                    </p>

                    <p className="font-serif text-xl md:text-2xl leading-loose text-gray-700 italic text-gold">
                        And in that decisive moment, my finger presses the shutter.
                    </p>

                    <div className="pt-12">
                        <button className="bg-black text-white px-10 py-4 text-xs font-sans tracking-[0.25em] uppercase hover:bg-gold transition-colors">
                            get in touch
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
      </div>
    </section>
  );
};