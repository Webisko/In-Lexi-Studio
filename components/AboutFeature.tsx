import React from 'react';
import { motion } from 'framer-motion';

export const AboutFeature: React.FC = () => {
  return (
    <section className="bg-dark-bg py-24 md:py-40 relative overflow-hidden text-white">
        {/* Background "ILS" Watermark */}
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none select-none">
            <span className="font-display text-[20rem] text-white leading-none">ILS</span>
        </div>

        <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row gap-20 items-center">
                
                {/* Left: Image with text overlay */}
                <div className="w-full md:w-1/2 relative">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="relative z-10"
                    >
                        <img 
                            src="https://images.unsplash.com/photo-1511285560982-1351cdeb9821?q=80&w=1000&auto=format&fit=crop" 
                            alt="Moments Preserved" 
                            className="w-full h-auto object-cover grayscale opacity-80" 
                        />
                        
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 bg-black/20">
                             <h2 className="font-display text-4xl md:text-6xl text-white mb-2 shadow-sm">Moments Preserved,</h2>
                             <h2 className="font-serif italic text-3xl md:text-5xl text-gold">Emotions Captured</h2>
                        </div>
                    </motion.div>
                </div>
                
                {/* Right: Narrative Text */}
                <div className="w-full md:w-1/2 space-y-8">
                   <div className="border-l-2 border-gold pl-6">
                       <p className="font-sans text-sm tracking-[0.2em] uppercase text-gray-400 mb-4">In Lexi Studio</p>
                       <h3 className="font-serif text-2xl md:text-3xl leading-snug italic text-white/90">
                           "Behind every frame lies a story waiting to unfold - discover the passion and perspective that transform ordinary moments into extraordinary memories."
                       </h3>
                   </div>
                   
                   <p className="font-light text-gray-300 leading-relaxed">
                     Every weekend, I witness pure magic – raw laughter, happy tears, stolen glances, and hearts overflowing with love.
                     As your wedding photographer, my mission is to preserve these precious moments forever.
                   </p>

                   <p className="font-light text-gray-300 leading-relaxed">
                     I’ve learned that what makes your wedding truly extraordinary isn’t the stunning venue, designer florals, or couture gown. It’s you – authentically, beautifully you.
                     Both of you, with your inside jokes, nervous giggles, and the way you look at each other when no one else is watching.
                     It’s your people too – the family who raised you, the friends who’ve stood by you, everyone who’s shaped your love story.
                   </p>

                   <p className="font-light text-gray-300 leading-relaxed">
                     This is what I capture: real moments, genuine emotions, life as it unfolds naturally.
                     No forced poses or artificial smiles – just you, living your most important day.
                     Every morning I wake up grateful to call myself a wedding photographer.
                     I get to be a storyteller, using my camera as my pen and light as my ink.
                     Through my lens, I speak the language of love, laughter, and legacy.
                   </p>

                   <div className="pt-8">
                       <h4 className="font-display text-xl mb-4">Ready to tell your story together?</h4>
                       <button className="border-b border-gold text-gold pb-1 hover:text-white hover:border-white transition-colors uppercase text-sm tracking-widest">
                           Let's create something beautiful.
                       </button>
                   </div>
                </div>
            </div>
        </div>
    </section>
  );
};