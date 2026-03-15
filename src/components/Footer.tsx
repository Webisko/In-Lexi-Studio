import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Facebook, Instagram } from 'lucide-react';
import { getSettings } from '../lib/api';
import type { Settings } from '../lib/api';

type FooterProps = {
  siteName?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  facebook?: string;
  footerText?: string;
  privacyUrl?: string;
};

export const Footer: React.FC<FooterProps> = ({
  siteName,
  email,
  phone,
  instagram,
  facebook,
  footerText,
  privacyUrl,
}) => {
  const [remoteSettings, setRemoteSettings] = useState<Settings | null>(null);
  const isMountedRef = useRef(true);

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

  const resolvedSiteName = remoteSettings?.site_name || siteName || 'In Lexi Studio';
  const resolvedFooterText =
    remoteSettings?.footer_text ||
    footerText ||
    `© ${new Date().getFullYear()} ${resolvedSiteName} | All rights reserved`;
  const resolvedEmail = remoteSettings?.email || email;
  const resolvedPhone = remoteSettings?.phone || phone;
  const resolvedInstagram = remoteSettings?.instagram || instagram;
  const resolvedFacebook = remoteSettings?.facebook || facebook;
  const baseUrl = import.meta.env.BASE_URL || '/';
  const resolvedPrivacyUrl =
    remoteSettings?.privacy_url || privacyUrl || `${baseUrl}privacy-policy`;
  const buildLink = (slug: string) => `${baseUrl}${slug}`;
  const offerLinks = [
    { label: 'Wedding', href: buildLink('wedding-photography') },
    { label: 'Portrait', href: buildLink('portrait-photography') },
    { label: 'Product', href: buildLink('product-photography') },
  ];
  const quickLinks = [
    { label: 'Approach', href: buildLink('approach') },
    { label: 'About', href: buildLink('about') },
    { label: 'Portfolio', href: buildLink('portfolio') },
  ];
  return (
    <footer
      id="contact"
      className="relative overflow-hidden bg-dark-bg px-6 pb-8 pt-24 text-white md:px-12"
    >
      <div className="pointer-events-none absolute right-0 top-0 select-none p-20 opacity-5">
        <span className="font-display text-[20rem] leading-none text-white">ILS</span>
      </div>

      <div className="container relative z-10 mx-auto">
        <div className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-14 lg:grid-cols-5">
          {/* Column 1: Intro / Vision */}
          <div className="md:col-span-2 lg:col-span-2">
            <h2 className="mb-6 font-display text-3xl md:text-5xl">Let's talk about your vision</h2>
            <div className="mb-8 h-[1px] w-16 bg-gold"></div>
            <p className="max-w-md font-sans text-lg leading-relaxed text-gray-400">
              We are ready to capture the authentic, beautiful moments of your life. Reach out to
              start the conversation.
            </p>
          </div>

          {/* Column 2: Offer */}
          <div>
            <h4 className="mb-6 font-sans text-sm uppercase tracking-[0.2em] text-gold">Offer</h4>
            <ul className="space-y-4 font-sans text-sm uppercase tracking-widest text-gray-300">
              {offerLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h4 className="mb-6 font-sans text-sm uppercase tracking-[0.2em] text-gold">
              Quick Links
            </h4>
            <ul className="space-y-4 font-sans text-sm uppercase tracking-widest text-gray-300">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h4 className="mb-6 font-sans text-sm uppercase tracking-[0.2em] text-gold">
              Contact Info
            </h4>
            <ul className="space-y-4 font-sans text-sm uppercase tracking-widest text-gray-300">
              {resolvedEmail ? (
                <li className="transition-colors hover:text-white">{resolvedEmail}</li>
              ) : (
                <li className="text-gray-500">Email not set</li>
              )}
              {resolvedPhone ? (
                <li className="transition-colors hover:text-white">{resolvedPhone}</li>
              ) : (
                <li className="text-gray-500">Phone not set</li>
              )}
              {(resolvedInstagram || resolvedFacebook) && (
                <li>
                  <div className="flex items-center gap-4 text-white/80">
                    {resolvedInstagram ? (
                      <a
                        href={resolvedInstagram}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Instagram"
                        className="transition-colors hover:text-gold"
                      >
                        <Instagram size={18} strokeWidth={1.8} />
                      </a>
                    ) : null}
                    {resolvedFacebook ? (
                      <a
                        href={resolvedFacebook}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Facebook"
                        className="transition-colors hover:text-gold"
                      >
                        <Facebook size={18} strokeWidth={1.8} />
                      </a>
                    ) : null}
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-[10px] uppercase tracking-widest text-gray-500 md:flex-row">
          <div>
            <span>Created by Webisko.pl</span>
          </div>

          <div>
            <span>{resolvedFooterText}</span>
          </div>

          <div>
            <a href={resolvedPrivacyUrl} className="transition-colors hover:text-gold">
              Privacy policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
