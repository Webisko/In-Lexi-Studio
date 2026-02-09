import React from 'react';
import { getImageSizes, getImageSrcSet, getImageUrl } from '../lib/api';

interface AboutFeatureProps {
  image?: string | null;
  imageAlt?: string;
}

export const AboutFeature: React.FC<AboutFeatureProps> = ({ image, imageAlt }) => {
  const fallbackMain =
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
  const mainImage = image ? getImageUrl(image) : fallbackMain;
  const mainSrcSet = image ? getImageSrcSet(image) : '';
  const mainSizes = mainSrcSet ? getImageSizes('half') : undefined;
  const mainAlt = imageAlt || 'Moments preserved';

  return (
    <section className="relative overflow-hidden bg-dark-bg py-24 text-white md:py-40">
      {/* Background "ILS" Watermark */}
      <div className="pointer-events-none absolute right-0 top-0 select-none p-20 opacity-5">
        <span className="font-display text-[20rem] leading-none text-white">ILS</span>
      </div>

      <div className="container relative z-10 mx-auto px-6">
        <div className="flex flex-col items-center gap-20 md:flex-row">
          {/* Left: Layered images (from AI Studio reference) */}
          <div className="relative flex h-[460px] w-full items-center justify-center md:h-[540px] md:w-1/2">
            <div className="absolute left-0 top-0 hidden h-56 w-40 md:block">
              <img
                src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=400&auto=format&fit=crop"
                alt="Detail 1"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover opacity-60 grayscale transition-all duration-700 hover:grayscale-0"
              />
            </div>

            <div className="relative z-10 w-full max-w-sm">
              <div className="relative aspect-[3/4]">
                <img
                  src={mainImage}
                  srcSet={mainSrcSet || undefined}
                  sizes={mainSizes}
                  alt={mainAlt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover shadow-2xl"
                />
                <div className="pointer-events-none absolute inset-0 m-4 border border-white/10" />

                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 p-8 text-center">
                  <h2 className="mb-2 font-display text-[clamp(2.25rem,3.6vw,3.75rem)] leading-[1.05] text-white shadow-sm">
                    Moments Preserved,
                  </h2>
                  <h2 className="font-serif text-[clamp(1.75rem,3vw,3.25rem)] italic leading-[1.05] text-gold">
                    Emotions Captured
                  </h2>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 right-6 hidden h-32 w-32 border-4 border-dark-bg md:block">
              <img
                src="https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=400&auto=format&fit=crop"
                alt="Detail 2"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Right: Narrative Text */}
          <div className="w-full space-y-8 md:w-1/2">
            <div className="border-l-2 border-gold pl-6">
              <p className="mb-4 font-sans text-sm uppercase tracking-[0.2em] text-gray-400">
                In Lexi Studio
              </p>
              <h3 className="font-serif text-2xl italic leading-snug text-white/90 md:text-3xl">
                "Behind every frame lies a story waiting to unfold - discover the passion and
                perspective that transform ordinary moments into extraordinary memories."
              </h3>
            </div>

            <p className="font-light leading-relaxed text-gray-300">
              Every weekend, I witness pure magic – raw laughter, happy tears, stolen glances, and
              hearts overflowing with love. As your wedding photographer, my mission is to preserve
              these precious moments forever.
            </p>

            <p className="font-light leading-relaxed text-gray-300">
              I’ve learned that what makes your wedding truly extraordinary isn’t the stunning
              venue, designer florals, or couture gown. It’s you – authentically, beautifully you.
              Both of you, with your inside jokes, nervous giggles, and the way you look at each
              other when no one else is watching. It’s your people too – the family who raised you,
              the friends who’ve stood by you, everyone who’s shaped your love story.
            </p>

            <p className="font-light leading-relaxed text-gray-300">
              This is what I capture: real moments, genuine emotions, life as it unfolds naturally.
              No forced poses or artificial smiles – just you, living your most important day. Every
              morning I wake up grateful to call myself a wedding photographer. I get to be a
              storyteller, using my camera as my pen and light as my ink. Through my lens, I speak
              the language of love, laughter, and legacy.
            </p>

            <div className="pt-8">
              <h4 className="mb-4 font-display text-xl">Ready to tell your story together?</h4>
              <button className="btn-primary">Let's create something beautiful.</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
