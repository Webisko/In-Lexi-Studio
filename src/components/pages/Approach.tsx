import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Eye, HeartHandshake, Camera } from 'lucide-react';
import type { Page } from '../../lib/api';
import { getImageSizes, getImageSrcSet, getImageUrl } from '../../lib/api';

interface Props {
  page: Page;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Approach({ page }: Props) {
  return (
    <div className="min-h-screen bg-[#080808] font-sans text-[#fcfcfc]">
      {/* Hero Section */}
      <div className="relative flex h-[50vh] min-h-[400px] w-full items-center justify-center overflow-hidden md:h-[60vh]">
        {page.hero_image && (
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: 'easeOut' }}
            src={getImageUrl(page.hero_image)}
            srcSet={getImageSrcSet(page.hero_image) || undefined}
            sizes={getImageSrcSet(page.hero_image) ? getImageSizes('hero') : undefined}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            alt={page.title}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#080808]" />

        <div className="relative z-10 px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-4 bg-gradient-to-r from-[#d4af37] via-[#f3eacb] to-[#c5a059] bg-clip-text font-display text-5xl text-transparent drop-shadow-lg md:text-7xl"
          >
            {page.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mx-auto max-w-2xl text-xl font-light tracking-wide text-gray-300 md:text-2xl"
          >
            Documentary. Editorial. Honest.
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        {/* Intro Quote */}
        <section className="mb-24 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mx-auto max-w-3xl"
          >
            <div className="mb-6 text-4xl text-[#d4af37]">“</div>
            <h2 className="mb-6 font-display text-2xl italic leading-relaxed text-white md:text-4xl">
              I believe the best photos aren't staged. They are felt. My approach is simple: be
              present, be subtle, and let the magic happen.
            </h2>
            <div className="mx-auto mt-8 h-[1px] w-16 bg-[#d4af37]/50" />
          </motion.div>
        </section>

        {/* How - What - Why Grid */}
        <section className="mb-32">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-8 md:grid-cols-3"
          >
            {/* HOW */}
            <motion.div
              variants={fadeInUp}
              className="group relative border-t-2 border-[#d4af37] bg-[#0f0f0f] p-8 transition-colors hover:bg-[#111] md:p-10"
            >
              <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                <Camera size={64} className="text-[#d4af37]" />
              </div>
              <div className="mb-6 text-[#d4af37]">
                <Eye size={32} strokeWidth={1.5} />
              </div>
              <h3 className="mb-4 font-display text-2xl text-white">How I Work</h3>
              <p className="leading-relaxed text-gray-400">
                I blend strict documentary practices with an editorial eye. This means I rarely
                interfere. I watch, I anticipate, and I click. For portraits, I offer gentle
                guidance to find the best light, but I never force a pose that feels unnatural to
                you.
              </p>
            </motion.div>

            {/* WHAT */}
            <motion.div
              variants={fadeInUp}
              className="group relative border-t-2 border-[#d4af37] bg-[#0f0f0f] p-8 transition-colors hover:bg-[#111] md:p-10"
            >
              <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                <Lightbulb size={64} className="text-[#d4af37]" />
              </div>
              <div className="mb-6 text-[#d4af37]">
                <Lightbulb size={32} strokeWidth={1.5} />
              </div>
              <h3 className="mb-4 font-display text-2xl text-white">What I Capture</h3>
              <p className="leading-relaxed text-gray-400">
                The in-between moments. The nervous hand-squeeze, the tear rolling down a cheek, the
                raucous laughter of your best friends. I focus on emotion, connection, and the
                intricate details that you’ve spent months planning.
              </p>
            </motion.div>

            {/* WHY */}
            <motion.div
              variants={fadeInUp}
              className="group relative border-t-2 border-[#d4af37] bg-[#0f0f0f] p-8 transition-colors hover:bg-[#111] md:p-10"
            >
              <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                <HeartHandshake size={64} className="text-[#d4af37]" />
              </div>
              <div className="mb-6 text-[#d4af37]">
                <HeartHandshake size={32} strokeWidth={1.5} />
              </div>
              <h3 className="mb-4 font-display text-2xl text-white">Why I Do It</h3>
              <p className="leading-relaxed text-gray-400">
                Because memory is fleeting, but a photograph is forever. I’m driven by the
                responsibility of preserving your legacy. I want you to look back at your photos in
                20 years and feel exactly what you felt in that moment.
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* Closing Statement */}
        <section className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden border border-[#ffffff]/10 p-12"
          >
            <div className="absolute left-0 top-0 h-20 w-20 border-l border-t border-[#d4af37]/30" />
            <div className="absolute bottom-0 right-0 h-20 w-20 border-b border-r border-[#d4af37]/30" />

            <h3 className="mb-6 font-display text-2xl text-white md:text-3xl">
              "Your story deserves to be told with authenticity and grace."
            </h3>
            <a
              href="/contact"
              className="inline-block border border-[#d4af37] px-8 py-3 text-sm uppercase tracking-widest text-[#d4af37] transition-colors duration-300 hover:bg-[#d4af37] hover:text-black"
            >
              Start The Conversation
            </a>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
