import React, { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../lib/api';

type NavigationProps = {
  ctaText?: string;
  ctaUrl?: string;
  megaMenuImage?: string;
  instagramUrl?: string;
};

export const Navigation: React.FC<NavigationProps> = ({
  ctaText,
  ctaUrl,
  megaMenuImage,
  instagramUrl,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuMounted, setIsMenuMounted] = useState(false);
  const [pages, setPages] = useState<Array<{ id: number; slug: string; title?: string }>>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [pagesError, setPagesError] = useState<string | null>(null);
  const resolvedCtaText = ctaText || 'get in touch';
  const resolvedCtaUrl = ctaUrl || '/contact';
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const megaMenuBgUrl = `${normalizedBaseUrl}In-Lexi-Studio_tlo.webp`;
  const megaMenuOverlayUrl = `${normalizedBaseUrl}In-Lexi-Studio-nakladka.webp`;
  const megaMenuImageUrl = megaMenuImage || megaMenuBgUrl;
  const resolvedInstagramUrl = instagramUrl || '';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) return;
    if (!isMenuMounted) return;
    const timeout = window.setTimeout(() => setIsMenuMounted(false), 300);
    return () => window.clearTimeout(timeout);
  }, [isMenuOpen, isMenuMounted]);

  const openMenu = () => {
    if (isMenuOpen) return;
    setIsMenuMounted(true);
    window.setTimeout(() => setIsMenuOpen(true), 10);
  };

  const closeMenu = () => {
    if (!isMenuMounted) return;
    setIsMenuOpen(false);
  };

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
      if (event.key === 'Escape') closeMenu();
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
    const normalizeSlug = (slug: string) =>
      String(slug || '')
        .replace(/^\/+/, '')
        .toLowerCase();
    const normalizeTitle = (title?: string) => (title || '').toLowerCase().replace(/\s+/g, '');
    const shouldExclude = (page: { slug: string; title?: string }) => {
      const slug = normalizeSlug(page.slug);
      const title = (page.title || '').toLowerCase();
      const compactTitle = normalizeTitle(page.title);
      if (!slug || slug === 'home' || slug === 'index' || slug === '/') return true;
      if (slug === 'in-lexi-studio' || slug === 'inlexistudio') return true;
      if (compactTitle === 'inlexistudio') return true;
      if (title.includes('home') && title.includes('legacy')) return true;
      return false;
    };

    const filtered = pages.filter((page) => !shouldExclude(page));
    const bySlug = new Map(filtered.map((page) => [normalizeSlug(page.slug), page]));
    const slugGroups = [
      ['wedding', 'wedding-photography'],
      ['portrait', 'portrait-photography'],
      ['product', 'product-photography'],
      ['my-approach', 'approach'],
      ['about', 'about-me'],
      ['portfolio'],
    ];

    return slugGroups
      .map((group) => group.map((slug) => bySlug.get(slug)).find(Boolean))
      .filter((page): page is { id: number; slug: string; title?: string } => Boolean(page));
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
              onClick={openMenu}
              className="group relative flex h-10 w-10 items-center justify-center focus:outline-none"
              aria-label="Open menu"
            >
              <div className="flex flex-col items-start gap-[6px] transition-all duration-300 group-hover:gap-[8px]">
                <span className="h-[2px] w-8 origin-right bg-white transition-all duration-300 group-hover:bg-gold"></span>
                <span className="h-[2px] w-5 bg-white transition-all delay-75 duration-300 group-hover:w-8 group-hover:bg-gold"></span>
                <span className="h-[2px] w-8 origin-right bg-white transition-all delay-150 duration-300 group-hover:bg-gold"></span>
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

      {isMenuMounted && (
        <div
          className={`fixed inset-0 z-[60] transform transition-all duration-300 ${
            isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
          } ${isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${megaMenuBgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <button
            type="button"
            onClick={closeMenu}
            className="absolute inset-0 h-full w-full cursor-pointer"
            aria-label="Close menu"
          />
          <div className="relative z-10 flex h-full w-full flex-col overflow-hidden px-6 py-8 md:px-12 lg:flex-row lg:px-16">
            <button
              type="button"
              onClick={closeMenu}
              className="absolute left-8 top-6 z-20 rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-widest text-white transition-colors hover:bg-white/10"
            >
              Zamknij
            </button>
            <div className="relative flex h-full flex-1 flex-col overflow-y-auto px-2 py-4 text-white lg:order-first lg:px-10 lg:py-10">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: `url(${megaMenuOverlayUrl})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
              <div className="relative flex flex-1 flex-col justify-center">
                {isLoadingPages && <div className="text-sm text-white/70">Ladowanie stron...</div>}
                {pagesError && (
                  <div className="rounded-xl border border-white/20 bg-white/10 p-6 text-sm text-white/80">
                    {pagesError}
                  </div>
                )}
                {!isLoadingPages && !pagesError && orderedPages.length === 0 && (
                  <div className="rounded-xl border border-white/20 bg-white/10 p-6 text-sm text-white/80">
                    Brak stron do wyswietlenia.
                  </div>
                )}
                {!isLoadingPages &&
                  !pagesError &&
                  orderedPages.map((page, index) => {
                    const url = buildPageUrl(page.slug);
                    const title = page.title || page.slug || 'Bez tytulu';
                    const indexLabel = String(index + 1).padStart(2, '0');
                    return (
                      <a
                        key={page.id}
                        href={url}
                        onClick={closeMenu}
                        className="group flex items-center gap-6 border-b border-white/10 py-4 text-white/60 transition hover:text-white"
                      >
                        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gold">
                          {indexLabel}
                        </span>
                        <div className="flex-1">
                          <h3 className="font-display text-3xl leading-tight text-white/70 transition group-hover:text-white md:text-4xl">
                            {title}
                          </h3>
                        </div>
                      </a>
                    );
                  })}
              </div>

              <div className="mt-10 flex flex-col gap-6 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
                {resolvedInstagramUrl ? (
                  <a
                    href={resolvedInstagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs uppercase tracking-[0.35em] text-white/50 transition hover:text-gold"
                  >
                    Follow me
                  </a>
                ) : (
                  <span className="text-xs uppercase tracking-[0.35em] text-white/50">
                    Follow me
                  </span>
                )}
                <a
                  href={resolvedCtaUrl}
                  className="inline-flex items-center justify-center rounded-full bg-gold px-8 py-4 text-sm uppercase tracking-[0.3em] text-black shadow-lg shadow-gold/20 transition hover:bg-gold-hover md:text-base"
                >
                  {resolvedCtaText}
                </a>
              </div>
            </div>
            <div className="hidden w-full lg:order-last lg:block lg:w-[45%] lg:-mr-16">
              <div className="relative h-full overflow-hidden">
                <div className="absolute inset-0 bg-black/30" />
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage: `url(${megaMenuImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
