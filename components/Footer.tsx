import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-bg text-white pt-24 pb-8 px-6 md:px-12">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-20 mb-20">
            
            {/* Column 1: Intro / Vision */}
            <div className="md:col-span-2">
                <h2 className="font-display text-3xl md:text-5xl mb-6">Let's talk about your vision</h2>
                <div className="w-16 h-[1px] bg-gold mb-8"></div>
                <p className="font-serif text-gray-400 leading-relaxed text-lg max-w-md">
                    We are ready to capture the authentic, beautiful moments of your life. Reach out to start the conversation.
                </p>
                {/* Placeholder for "Olive Green Color Palette Facebook Post with Audio" visual representation */}
                <div className="mt-8 bg-[#3d422e] w-full h-32 rounded flex items-center justify-center border border-white/10">
                    <span className="text-xs uppercase tracking-widest text-white/50">Audio Post Preview</span>
                </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
                <h4 className="font-sans text-xs tracking-[0.2em] uppercase text-gold mb-6">Quick Links</h4>
                <ul className="space-y-4 font-sans text-xs tracking-widest uppercase text-gray-300">
                    <li className="hover:text-white cursor-pointer transition-colors">Element #1</li>
                    <li className="hover:text-white cursor-pointer transition-colors">Element #2</li>
                    <li className="hover:text-white cursor-pointer transition-colors">Element #3</li>
                </ul>
            </div>

            {/* Column 3: Contact Info */}
            <div>
                <h4 className="font-sans text-xs tracking-[0.2em] uppercase text-gold mb-6">Contact Info</h4>
                <ul className="space-y-4 font-sans text-xs tracking-widest uppercase text-gray-300">
                    <li className="hover:text-white cursor-pointer transition-colors">Element #1</li>
                    <li className="hover:text-white cursor-pointer transition-colors">Element #2</li>
                    <li className="hover:text-white cursor-pointer transition-colors">Element #3</li>
                </ul>
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-gray-500">
            <div>
                <span>Created by Webisko.pl</span>
            </div>
            
            <div>
                <span>© 2026 In Lexi Studio | All rights reserved</span>
            </div>
            
            <div>
                <span className="hover:text-gold cursor-pointer transition-colors">Privacy policy</span>
            </div>
        </div>
      </div>
    </footer>
  );
};