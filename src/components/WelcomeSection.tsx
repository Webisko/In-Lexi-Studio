import React from 'react';

export const WelcomeSection: React.FC = () => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const buildLink = (slug: string) => `${baseUrl}${slug}`;
  const hotspotLinks = [
    { word: 'IN', slug: 'approach', label: 'APPROACH' },
    { word: 'LEXI', slug: 'about', label: 'ABOUT' },
    { word: 'STUDIO', slug: 'portfolio', label: 'PORTFOLIO' },
  ] as const;

  return (
    <section className="overflow-x-hidden px-4 py-24 text-white md:px-12 md:py-32">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="grid grid-cols-1 items-center gap-14 md:grid-cols-2 md:gap-20">
          {/* Left: Title block */}
          <div className="flex flex-col items-center justify-center self-center text-center md:justify-self-center">
            <h2 className="font-display text-[clamp(1.4rem,2vw,2.2rem)] leading-[0.95] tracking-wide">
              <span className="block">WELCOME</span>
              <span className="mt-4 block font-serif text-[clamp(1.1rem,1.6vw,1.6rem)] italic tracking-normal text-white/80">
                to
              </span>
              <div className="mt-6 flex flex-col items-center gap-10 text-[clamp(3.5rem,6vw,6rem)] leading-[0.9] tracking-[0.1em] md:gap-6">
                {hotspotLinks.map((item) => (
                  <div
                    key={item.word}
                    className="group relative inline-flex items-center justify-center"
                  >
                    <span className="block transition-colors duration-300 group-hover:text-[#d4af37]">
                      {item.word}
                    </span>
                    <a
                      href={buildLink(item.slug)}
                      className="absolute left-full top-1/2 ml-3 flex -translate-y-1/2 items-center md:ml-4"
                    >
                      <span className="hotspot-wrap" aria-hidden="true">
                        <span className="hotspot-pulse" aria-hidden="true" />
                        <span className="hotspot" aria-hidden="true" />
                      </span>
                      <span className="ml-4 hidden items-center rounded-full bg-white px-6 py-2 font-sans text-sm uppercase tracking-[0.25em] text-[#936328] hover:bg-gold hover:text-white md:inline-flex md:-translate-x-3 md:text-base md:opacity-0 md:transition-all md:duration-300 md:group-hover:translate-x-0 md:group-hover:opacity-100">
                        {item.label}
                      </span>
                    </a>
                  </div>
                ))}
              </div>
            </h2>

            <div className="mt-8 h-[1px] w-16 bg-gold" />
          </div>

          {/* Right: Narrative */}
          <div className="space-y-8">
            <div className="text-center md:text-left">
              <p className="font-sans text-[clamp(0.9rem,1.2vw,1.1rem)] font-medium uppercase tracking-[0.25em] text-white">
                MY PULSE QUICKENS.
                <br />
                ADRENALINE COURSES THROUGH MY BODY.
                <br />
                EVERY SENSE HEIGHTENED.
              </p>
            </div>

            <div className="space-y-6 font-sans text-[clamp(1rem,1.05vw,1.15rem)] leading-relaxed text-white/80">
              <p>
                <span className="block">
                  I scan the scene, taking it all in: expressions, connections, raw emotion.
                </span>
                <span className="block">
                  I witness joyful tears streaming down cheeks, spontaneous laughter erupting,
                </span>
                <span className="block">and embraces that speak volumes without words.</span>
                <span className="block">People truly present for this single, precious day.</span>
                <span className="block">
                  Souls living in the moment, leaving their worries behind.
                </span>
              </p>

              <p>
                <span className="block">This singular &quot;now&quot; becomes everything.</span>
                <span className="block">The past dissolves. The future waits.</span>
                <span className="block">Only this perfect, fleeting instant matters -</span>
                <span className="block">pure, unadulterated celebration of life and love.</span>
              </p>

              <p className="font-serif text-2xl italic leading-snug text-white md:text-3xl lg:text-[2.15rem]">
                And in that decisive moment, my finger presses the shutter.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 flex justify-center">
          <a href="#contact" className="btn-secondary">
            GET IN TOUCH
          </a>
        </div>
      </div>
    </section>
  );
};
