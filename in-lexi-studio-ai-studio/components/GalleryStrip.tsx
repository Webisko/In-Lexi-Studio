import React from 'react';
import { motion } from 'framer-motion';

export const GalleryStrip: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-white px-6 py-24 md:py-40">
      {/* Added Background Texture/Image for visual richness */}
      <div className="pointer-events-none absolute inset-0 opacity-5">
        <img
          src="https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?q=80&w=2000&auto=format&fit=crop"
          alt="Texture"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="container relative z-10 mx-auto">
        <div className="flex flex-col items-start gap-16 md:flex-row md:gap-24">
          {/* Left Column: Welcome */}
          <div className="sticky top-32 w-full md:w-1/3">
            <motion.h2
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="font-display text-5xl leading-tight text-black md:text-7xl"
            >
              Welcome <br />
              <span className="mt-2 block font-serif text-3xl italic text-gray-500 md:text-4xl">
                to
              </span>
              IN LEXI <br /> STUDIO
            </motion.h2>
            <div className="mb-8 mt-8 h-[1px] w-12 bg-gold"></div>

            {/* Small inserted image for more photos */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 hidden h-48 w-full overflow-hidden md:block"
            >
              <img
                src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=600&auto=format&fit=crop"
                alt="Welcome detail"
                className="h-full w-full object-cover opacity-80"
              />
            </motion.div>
          </div>

          {/* Right Column: Poetic Text */}
          <div className="w-full md:w-2/3">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h3 className="font-sans text-lg font-bold uppercase leading-relaxed tracking-widest text-black md:text-xl">
                MY PULSE QUICKENS.
                <br />
                ADRENALINE COURSES THROUGH MY BODY.
                <br />
                EVERY SENSE HEIGHTENED.
              </h3>

              <p className="font-serif text-xl leading-loose text-gray-700 md:text-2xl">
                I scan the scene, taking it all in: expressions, connections, raw emotion. I witness
                joyful tears streaming down cheeks, spontaneous laughter erupting, and embraces that
                speak volumes without words. People truly present for this single, precious day.
                Souls living in the moment, leaving their worries behind.
              </p>

              <p className="font-serif text-xl leading-loose text-gray-700 md:text-2xl">
                This singular "now" becomes everything.
                <br />
                The past dissolves.
                <br />
                The future waits.
                <br />
                Only this perfect, fleeting instant matters - pure, unadulterated celebration of
                life and love.
              </p>

              <p className="font-serif text-xl italic leading-loose text-gold text-gray-700 md:text-2xl">
                And in that decisive moment, my finger presses the shutter.
              </p>

              <div className="pt-12">
                <button className="bg-black px-10 py-4 font-sans text-xs uppercase tracking-[0.25em] text-white transition-colors hover:bg-gold">
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
