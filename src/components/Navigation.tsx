import React, { useState, useEffect } from 'react';

export const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 px-8 py-6 transition-all duration-500 ${isScrolled ? 'bg-dark-bg/70 py-4 backdrop-blur-md' : 'bg-transparent'}`}
      >
        <div className="flex w-full items-center justify-between">
          {/* Left: Custom Menu Icon */}
          <div className="flex w-1/3 justify-start">
            <button className="group relative flex h-10 w-10 items-center justify-center focus:outline-none">
              <div className="flex flex-col items-start gap-[6px] transition-all duration-300 group-hover:gap-[8px]">
                <span className="h-[1px] w-8 origin-right bg-white transition-all duration-300 group-hover:bg-gold"></span>
                <span className="h-[1px] w-5 bg-white transition-all delay-75 duration-300 group-hover:w-8 group-hover:bg-gold"></span>
                <span className="h-[1px] w-8 origin-right bg-white transition-all delay-150 duration-300 group-hover:bg-gold"></span>
              </div>
            </button>
          </div>

          {/* Center: IN LEXI STUDIO (Logo Text) */}
          <div className="flex w-1/3 justify-center">
            <span className="font-display text-lg tracking-widest text-white md:text-xl">
              IN LEXI STUDIO
            </span>
          </div>

          {/* Right: GET IN TOUCH */}
          <div className="flex w-1/3 justify-end">
            <a
              href="/contact"
              className="border-b border-transparent pb-1 font-sans text-[10px] uppercase tracking-[0.2em] text-white transition-colors hover:border-gold hover:text-gold md:text-xs"
            >
              get in touch
            </a>
          </div>
        </div>
      </nav>

      {/* Full Screen Menu Overlay (Hidden logic) */}
    </>
  );
};
