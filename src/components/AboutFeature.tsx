import React from 'react';

export const AboutFeature: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-dark-bg py-24 text-white md:py-40">
      {/* Background "ILS" Watermark */}
      <div className="pointer-events-none absolute right-0 top-0 select-none p-20 opacity-5">
        <span className="font-display text-[20rem] leading-none text-white">ILS</span>
      </div>

      <div className="container relative z-10 mx-auto px-6">
        <div className="flex flex-col items-center gap-20 md:flex-row">
          {/* Left: Image with text overlay */}
          <div className="relative w-full md:w-1/2">
            <div className="relative z-10">
              <img
                src="https://images.unsplash.com/photo-1511285560982-1351cdeb9821?q=80&w=1000&auto=format&fit=crop"
                alt="Moments Preserved"
                className="h-auto w-full object-cover opacity-80 grayscale"
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 p-8 text-center">
                <h2 className="mb-2 font-display text-4xl text-white shadow-sm md:text-6xl">
                  Moments Preserved,
                </h2>
                <h2 className="font-serif text-3xl italic text-gold md:text-5xl">
                  Emotions Captured
                </h2>
              </div>
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
