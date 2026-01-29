import React from 'react';

export const WelcomeSection: React.FC = () => {
  return (
    <section className="px-4 py-24 text-white md:px-12 md:py-32">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 items-start gap-14 md:grid-cols-2 md:gap-20">
          {/* Left: Title block */}
          <div className="flex flex-col items-center justify-center text-center md:justify-self-center">
            <h2 className="font-display text-[clamp(1.4rem,2vw,2.2rem)] leading-[0.95] tracking-wide">
              <span className="block">WELCOME</span>
              <span className="mt-4 block font-serif text-[clamp(1.1rem,1.6vw,1.6rem)] italic tracking-normal text-white/80">
                to
              </span>
              <div className="mt-6 flex flex-col items-center gap-6 text-[clamp(3.5rem,6vw,6rem)] leading-[0.9] tracking-[0.1em]">
                <div className="relative inline-flex items-center justify-center">
                  <span className="block">IN</span>
                  <div className="group absolute left-full top-1/2 ml-4 flex -translate-y-1/2 items-center">
                    <span className="hotspot-wrap" aria-hidden="true">
                      <span className="hotspot-pulse" aria-hidden="true" />
                      <span className="hotspot" aria-hidden="true" />
                    </span>
                    <span className="ml-4 inline-flex -translate-x-3 items-center rounded-full bg-white px-6 py-2 font-sans text-sm uppercase tracking-[0.25em] text-black opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:text-base">
                      APPROACH
                    </span>
                  </div>
                </div>
                <div className="relative inline-flex items-center justify-center">
                  <span className="block">LEXI</span>
                  <div className="group absolute left-full top-1/2 ml-4 flex -translate-y-1/2 items-center">
                    <span className="hotspot-wrap" aria-hidden="true">
                      <span className="hotspot-pulse" aria-hidden="true" />
                      <span className="hotspot" aria-hidden="true" />
                    </span>
                    <span className="ml-4 inline-flex -translate-x-3 items-center rounded-full bg-white px-6 py-2 font-sans text-sm uppercase tracking-[0.25em] text-black opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:text-base">
                      ABOUT
                    </span>
                  </div>
                </div>
                <div className="relative inline-flex items-center justify-center">
                  <span className="block">STUDIO</span>
                  <div className="group absolute left-full top-1/2 ml-4 flex -translate-y-1/2 items-center">
                    <span className="hotspot-wrap" aria-hidden="true">
                      <span className="hotspot-pulse" aria-hidden="true" />
                      <span className="hotspot" aria-hidden="true" />
                    </span>
                    <span className="ml-4 inline-flex -translate-x-3 items-center rounded-full bg-white px-6 py-2 font-sans text-sm uppercase tracking-[0.25em] text-black opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:text-base">
                      PORTFOLIO
                    </span>
                  </div>
                </div>
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

            <div className="space-y-6 font-serif text-[clamp(1.05rem,1.4vw,1.35rem)] leading-relaxed text-white/80">
              <p>
                I scan the scene, taking it all in: expressions, connections, raw emotion. I witness
                joyful tears streaming down cheeks, spontaneous laughter erupting, and embraces that
                speak volumes without words. People truly present for this single, precious day.
                Souls living in the moment, leaving their worries behind.
              </p>

              <p>
                This singular &quot;now&quot; becomes everything. The past dissolves. The future
                waits. Only this perfect, fleeting instant matters - pure, unadulterated celebration
                of life and love.
              </p>

              <p className="italic text-white">
                And in that decisive moment, my finger presses the shutter.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 flex justify-center">
          <a href="#contact" className="btn-primary">
            GET IN TOUCH
          </a>
        </div>
      </div>
    </section>
  );
};
