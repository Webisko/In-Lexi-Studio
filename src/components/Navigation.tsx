import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_URL, getImageUrl, getSettings } from '../lib/api';
import type { Settings } from '../lib/api';

type NavigationProps = {
  currentPath?: string;
  ctaText?: string;
  ctaUrl?: string;
  megaMenuImage?: string;
  instagramUrl?: string;
};

export const Navigation: React.FC<NavigationProps> = ({
  currentPath,
  ctaText,
  ctaUrl,
  megaMenuImage,
  instagramUrl,
}) => {
  const isHomePath = currentPath === '/';
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [ctaFillProgress, setCtaFillProgress] = useState<number>(() => {
    return isHomePath ? 0 : 1;
  });
  const [navTitleOpacity, setNavTitleOpacity] = useState<number>(() => {
    return isHomePath ? 0 : 1;
  });
  const [isMenuMounted, setIsMenuMounted] = useState(false);

  const [pages, setPages] = useState<Array<{ id: number; slug: string; title?: string }>>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [remoteSettings, setRemoteSettings] = useState<Settings | null>(null);
  const isMountedRef = useRef(true);
  const lastScrollYRef = useRef(0);
  const resolvedCtaText = remoteSettings?.cta_text || ctaText || 'get in touch';
  const resolvedCtaUrl = remoteSettings?.cta_url || ctaUrl || '/contact';
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const megaMenuBgUrl = `${normalizedBaseUrl}In-Lexi-Studio_tlo.webp`;
  const megaMenuOverlayUrl = `${normalizedBaseUrl}In-Lexi-Studio-nakladka.webp`;
  const megaMenuImageUrl =
    megaMenuImage ||
    (remoteSettings?.mega_menu_image ? getImageUrl(remoteSettings.mega_menu_image) : '') ||
    megaMenuBgUrl;
  const resolvedInstagramUrl = remoteSettings?.instagram || instagramUrl || '';
  const logoUrl = remoteSettings?.logo_path ? getImageUrl(remoteSettings.logo_path) : '';
  const homeHref = normalizedBaseUrl;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const heroElement = document.querySelector<HTMLElement>('[data-page-hero]');
      const heroScrollThreshold = heroElement ? Math.max(heroElement.offsetHeight - 120, 50) : 50;
      setIsScrolled(currentScrollY > heroScrollThreshold);

      const scrollingDown = currentScrollY > lastScrollYRef.current;
      const hasScrollThreshold = currentScrollY > 800;

      if (scrollingDown && hasScrollThreshold && !isMenuOpen) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }

      // Sync nav title opacity with hero logo fade-out (Hero fades logo 0→300px)
      const onHome = Boolean(heroElement);
      if (onHome) {
        const FADE_START = 220;
        const FADE_END = 330;
        const CTA_START = 100;
        const CTA_END = 220;
        const opacity = Math.max(
          0,
          Math.min(1, (currentScrollY - FADE_START) / (FADE_END - FADE_START)),
        );
        const ctaProgress = Math.max(
          0,
          Math.min(1, (currentScrollY - CTA_START) / (CTA_END - CTA_START)),
        );
        setNavTitleOpacity(opacity);
        setCtaFillProgress(ctaProgress);
      } else {
        setNavTitleOpacity(1);
        setCtaFillProgress(1);
      }

      lastScrollYRef.current = currentScrollY;
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuOpen]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadSettings = useCallback(async () => {
    const data = await getSettings();
    if (!isMountedRef.current || !data) return;
    setRemoteSettings(data);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    let lastRun = 0;

    const revalidate = () => {
      const now = Date.now();
      if (now - lastRun < 5000) return;
      lastRun = now;
      loadSettings();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        revalidate();
      }
    };

    window.addEventListener('focus', revalidate);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', revalidate);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [loadSettings]);

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

  const navCtaStyle = useMemo(
    () => ({
      backgroundColor: `rgba(252, 252, 252, ${ctaFillProgress * 0.16})`,
      borderColor: `rgba(252, 252, 252, ${0.22 + ctaFillProgress * 0.22})`,
      color: '#fcfcfc',
      boxShadow:
        ctaFillProgress > 0.16
          ? `0 16px 34px rgba(0, 0, 0, ${0.14 + ctaFillProgress * 0.08})`
          : 'none',
      backdropFilter: ctaFillProgress > 0.16 ? 'blur(14px)' : 'none',
      WebkitBackdropFilter: ctaFillProgress > 0.16 ? 'blur(14px)' : 'none',
    }),
    [ctaFillProgress],
  );

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 px-4 py-4 transition-all duration-500 sm:px-6 md:px-8 md:py-6 ${isScrolled ? 'bg-[#1f2c24]/45 backdrop-blur-md md:py-4' : 'bg-transparent'} ${isNavVisible || isMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="grid w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 md:flex md:items-center md:justify-between">
          {/* Left: Custom Menu Icon */}
          <div className="flex justify-start md:w-1/3">
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

          {/* Center: IN LEXI STUDIO */}
          <div
            className={`flex min-w-0 justify-center transition-opacity duration-150 md:w-1/3 ${
              navTitleOpacity < 0.05 ? 'pointer-events-none' : ''
            }`}
            style={{ opacity: navTitleOpacity }}
          >
            <a
              href={homeHref}
              className="nav-brand-text block max-w-full truncate text-center font-display text-white transition-colors hover:text-gold"
            >
              IN LEXI STUDIO
            </a>
          </div>

          {/* Right: GET IN TOUCH */}
          <div className="flex justify-end md:w-1/3">
            <a
              href={resolvedCtaUrl}
              className="btn-primary sm:!px-4.5 !px-3.5 !py-2.5 !text-[0.68rem] !tracking-[0.18em] sm:!text-[0.72rem] md:!px-9 md:!py-3 md:!text-[0.8rem] md:!tracking-[0.25em]"
              style={navCtaStyle}
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
          <div className="relative z-10 flex h-full w-full flex-col overflow-hidden px-6 py-8 md:px-12 lg:flex-row lg:px-16 lg:py-0">
            <button
              type="button"
              onClick={closeMenu}
              className="menu-meta-text absolute left-8 top-6 z-20 rounded-full border border-white/30 px-4 py-2 uppercase text-white transition-colors hover:bg-white/10"
            >
              Close
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
                        <span className="eyebrow-text font-semibold uppercase text-gold">
                          {indexLabel}
                        </span>
                        <div className="flex-1">
                          <h3 className="menu-overlay-title font-display text-white/70 transition group-hover:text-white">
                            {title}
                          </h3>
                        </div>
                      </a>
                    );
                  })}
              </div>

              <div className="mt-10 flex flex-col gap-6 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
                <div className="menu-meta-text flex flex-wrap items-center gap-4 uppercase text-white/50">
                  <span>Follow me</span>
                  {resolvedInstagramUrl ? (
                    <a
                      href={resolvedInstagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="transition hover:text-gold"
                    >
                      Instagram
                    </a>
                  ) : null}
                  {remoteSettings?.facebook ? (
                    <a
                      href={remoteSettings.facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="transition hover:text-gold"
                    >
                      Facebook
                    </a>
                  ) : null}
                </div>
                <a
                  href={resolvedCtaUrl}
                  className="btn-secondary shadow-lg shadow-gold/20 md:text-base"
                >
                  {resolvedCtaText}
                </a>
              </div>
            </div>
            <div className="hidden w-full lg:order-last lg:-mr-16 lg:block lg:h-full lg:w-[45%]">
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
