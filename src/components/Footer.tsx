import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-dark-bg px-6 pb-8 pt-24 text-white md:px-12">
      <div className="container mx-auto">
        <div className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-20">
          {/* Column 1: Intro / Vision */}
          <div className="md:col-span-2">
            <h2 className="mb-6 font-display text-3xl md:text-5xl">Let's talk about your vision</h2>
            <div className="mb-8 h-[1px] w-16 bg-gold"></div>
            <p className="max-w-md font-serif text-lg leading-relaxed text-gray-400">
              We are ready to capture the authentic, beautiful moments of your life. Reach out to
              start the conversation.
            </p>
            {/* Placeholder for "Olive Green Color Palette Facebook Post with Audio" visual representation */}
            <div className="mt-8 flex h-32 w-full items-center justify-center rounded border border-white/10 bg-[#3d422e]">
              <span className="text-xs uppercase tracking-widest text-white/50">
                Audio Post Preview
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="mb-6 font-sans text-xs uppercase tracking-[0.2em] text-gold">
              Quick Links
            </h4>
            <ul className="space-y-4 font-sans text-xs uppercase tracking-widest text-gray-300">
              <li className="cursor-pointer transition-colors hover:text-white">Element #1</li>
              <li className="cursor-pointer transition-colors hover:text-white">Element #2</li>
              <li className="cursor-pointer transition-colors hover:text-white">Element #3</li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h4 className="mb-6 font-sans text-xs uppercase tracking-[0.2em] text-gold">
              Contact Info
            </h4>
            <ul className="space-y-4 font-sans text-xs uppercase tracking-widest text-gray-300">
              <li className="cursor-pointer transition-colors hover:text-white">Element #1</li>
              <li className="cursor-pointer transition-colors hover:text-white">Element #2</li>
              <li className="cursor-pointer transition-colors hover:text-white">Element #3</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-[10px] uppercase tracking-widest text-gray-500 md:flex-row">
          <div>
            <span>Created by Webisko.pl</span>
          </div>

          <div>
            <span>© 2026 In Lexi Studio | All rights reserved</span>
          </div>

          <div>
            <span className="cursor-pointer transition-colors hover:text-gold">Privacy policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
