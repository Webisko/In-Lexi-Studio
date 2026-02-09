import React, { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../lib/api';

type NavigationProps = {
  ctaText?: string;
  ctaUrl?: string;
};

export const Navigation: React.FC<NavigationProps> = ({ ctaText, ctaUrl }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pages, setPages] = useState<Array<{ id: number; slug: string; title?: string }>>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [pagesError, setPagesError] = useState<string | null>(null);
  const resolvedCtaText = ctaText || 'get in touch';
  const resolvedCtaUrl = ctaUrl || '/contact';
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const megaMenuBgUrl = `${normalizedBaseUrl}In-Lexi-Studio_tlo.webp`;
  const megaMenuOverlayUrl = `${normalizedBaseUrl}In-Lexi-Studio-nakladka.webp`;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    if (pages.length > 0 || isLoadingPages) return;

    const loadPages = async () => {
      setIsLoadingPages(true);
      setPagesError(null);
      try {
        const res = await fetch(`${API_URL}/pages`);
        if (!res.ok) throw new Error('Failed to load pages');
        const data = await res.json();
        setPages(Array.isArray(data) ? data : []);
      } catch (err) {
        setPagesError('Nie udalo sie pobrac stron.');
      } finally {
        setIsLoadingPages(false);
      }
    };

    loadPages();
  }, [isMenuOpen, pages.length, isLoadingPages]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  const buildPageUrl = (slug: string) => {
    const normalized = String(slug || '').replace(/^\/+/, '');
    if (!normalized || normalized === 'home') return normalizedBaseUrl;
    return `${normalizedBaseUrl}${normalized}`;
  };

  const orderedPages = useMemo(() => {
    return [...pages].sort((a, b) => {
      const aTitle = a.title || '';
      const bTitle = b.title || '';
      return aTitle.localeCompare(bTitle, 'pl');
    });
  }, [pages]);

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 px-8 py-6 transition-all duration-500 ${isScrolled ? 'bg-dark-bg/70 py-4 backdrop-blur-md' : 'bg-transparent'}`}
      >
        <div className="flex w-full items-center justify-between">
          {/* Left: Custom Menu Icon */}
          <div className="flex w-1/3 justify-start">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="group relative flex h-10 w-10 items-center justify-center focus:outline-none"
              aria-label="Open menu"
            >
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
              href={resolvedCtaUrl}
              className="border-b border-transparent pb-1 font-sans text-[10px] uppercase tracking-[0.2em] text-white transition-colors hover:border-gold hover:text-gold md:text-xs"
            >
              {resolvedCtaText}
            </a>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${megaMenuBgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url(${megaMenuOverlayUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.7,
            }}
          />
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 h-full w-full cursor-pointer"
            aria-label="Close menu"
          />
          <div className="relative z-10 flex h-full w-full flex-col px-8 py-10 md:px-14">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Mega Menu</p>
                <h2 className="font-display text-4xl text-white md:text-5xl">Wybierz stronę</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-widest text-white transition-colors hover:bg-white/10"
              >
                Zamknij
              </button>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoadingPages && (
                <div className="col-span-full text-sm text-white/70">Ladowanie stron...</div>
              )}
              {pagesError && (
                <div className="col-span-full rounded-xl border border-white/20 bg-white/10 p-6 text-sm text-white/80">
                  {pagesError}
                </div>
              )}
              {!isLoadingPages && !pagesError && orderedPages.length === 0 && (
                <div className="col-span-full rounded-xl border border-white/20 bg-white/10 p-6 text-sm text-white/80">
                  Brak stron do wyswietlenia.
                </div>
              )}
              {!isLoadingPages &&
                !pagesError &&
                orderedPages.map((page) => {
                  const url = buildPageUrl(page.slug);
                  const title = page.title || page.slug || 'Bez tytulu';
                  const normalized = String(page.slug || '').replace(/^\/+/, '');
                  const label =
                    !normalized || normalized === 'home' ? 'Strona glowna' : `/${normalized}`;
                  return (
                    <a
                      key={page.id}
                      href={url}
                      className="group rounded-xl border border-white/15 bg-white/5 p-5 text-white/80 transition hover:border-white/40 hover:bg-white/10"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">{label}</p>
                      <h3 className="mt-3 font-display text-2xl text-white group-hover:text-white">
                        {title}
                      </h3>
                      <p className="mt-2 text-xs uppercase tracking-[0.25em] text-white/60">
                        Otworz strone
                      </p>
                    </a>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
