import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Eye, HeartHandshake, Camera, Quote } from 'lucide-react';
import type { Page } from '../../lib/api';
import { getImageSizes, getImageSrcSet, getImageUrl } from '../../lib/api';

interface Props {
  page: Page;
}

const UPLOADS = {
  story1: getImageUrl('/uploads/ils-185.webp'),
  story2: getImageUrl('/uploads/ils-212.webp'),
  story3: getImageUrl('/uploads/ils-206.webp'),
};

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
      <div
        data-page-hero
        className="relative flex h-[75vh] min-h-[560px] w-full items-end justify-center overflow-hidden md:h-[90vh]"
      >
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
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080808]/10 to-[#080808]/35" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#080808]/30 to-[#080808]" />

        <div className="relative z-10 px-4 pb-28 text-center md:pb-32">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="display-page-title mb-4 bg-gradient-to-r from-[#d4af37] via-[#f3eacb] to-[#c5a059] bg-clip-text font-display text-transparent drop-shadow-lg"
          >
            {page.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="display-subtitle mx-auto max-w-2xl font-light tracking-wide text-gray-300"
          >
            Documentary. Editorial. Honest.
          </motion.p>
        </div>

        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-4">
          <div className="relative h-12 w-[1px] overflow-hidden bg-white/20">
            <div className="landing-scroll-line absolute left-0 top-0 h-1/2 w-full bg-white" />
          </div>
          <p className="scroll-indicator-text font-display uppercase text-white/80">Scroll</p>
        </div>
      </div>

      <div className="section-pad container mx-auto max-w-6xl px-6 md:px-10">
        {/* Intro Quote */}
        <section className="mb-24 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mx-auto max-w-3xl"
          >
            <Quote className="mx-auto mb-6 block h-8 w-8 text-[#d4af37]/40" />
            <h2 className="display-quote mb-6 font-display italic text-white">
              I believe the best photos aren't staged. They are felt. My approach is simple: be
              present, be subtle, and let the magic happen.
            </h2>
            <div className="mx-auto mt-8 h-[1px] w-16 bg-[#d4af37]/50" />
          </motion.div>
        </section>

        {/* How - What - Why Grid */}
        <section>
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
              className="group relative border-2 border-[#ffffff]/5 border-t-[#d4af37] bg-[#0f0f0f] p-8 transition-all duration-500 hover:border-[#d4af37] hover:bg-[#111] md:p-10"
            >
              <div className="absolute right-0 top-0 origin-top-right scale-100 p-4 opacity-10 transition-all duration-500 group-hover:scale-125 group-hover:opacity-25">
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
              className="group relative border-2 border-[#ffffff]/5 border-t-[#d4af37] bg-[#0f0f0f] p-8 transition-all duration-500 hover:border-[#d4af37] hover:bg-[#111] md:p-10"
            >
              <div className="absolute right-0 top-0 origin-top-right scale-100 p-4 opacity-10 transition-all duration-500 group-hover:scale-125 group-hover:opacity-25">
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
              className="group relative border-2 border-[#ffffff]/5 border-t-[#d4af37] bg-[#0f0f0f] p-8 transition-all duration-500 hover:border-[#d4af37] hover:bg-[#111] md:p-10"
            >
              <div className="absolute right-0 top-0 origin-top-right scale-100 p-4 opacity-10 transition-all duration-500 group-hover:scale-125 group-hover:opacity-25">
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
      </div>

      {/* THREE-IMAGE STRIP — full bleed */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="grid grid-cols-3"
      >
        {[UPLOADS.story1, UPLOADS.story2, UPLOADS.story3].map((src, i) => (
          <motion.div key={i} variants={fadeInUp} className="overflow-hidden">
            <img
              src={src}
              alt={'In Lexi Studio — approach ' + (i + 1)}
              loading="lazy"
              decoding="async"
              className="h-[40vh] w-full object-cover transition-transform duration-700 hover:scale-105 md:h-[55vh]"
            />
          </motion.div>
        ))}
      </motion.div>

      {/* NARRATIVE — centered editorial text + blockquote */}
      <section className="section-pad">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-12 space-y-5 text-[1.05rem] leading-relaxed text-gray-400"
          >
            <p>
              My passion and goal is creating beautiful, heartfelt photographs that become treasured
              pieces of your family&apos;s story. I specialise in weddings and receptions, but
              I&apos;m equally excited to capture any celebration that&apos;s meaningful to you
              &mdash; whether it&apos;s an anniversary, milestone birthday, engagement party, or
              intimate family gathering.
            </p>
            <p>
              These aren&apos;t just photos; they&apos;re the memories your family will cherish for
              generations to come.
            </p>
          </motion.div>

          <motion.blockquote
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="border-l-2 border-[#d4af37] py-2 pl-8"
          >
            <p className="font-serif text-xl italic leading-relaxed text-white md:text-2xl">
              &bdquo;I don&apos;t just take wedding photos &mdash; I preserve your love
              story.&ldquo;
            </p>
          </motion.blockquote>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-12 space-y-5 text-[1.05rem] leading-relaxed text-gray-400"
          >
            <p>
              Your wedding day will be over before you know it. Memories may fade, but your photos
              will tell your story forever &mdash; capturing every smile, every tear, every moment
              of pure joy.
            </p>
            <p>
              From stolen glances to the dance floor magic, I&apos;ll be there for it all. These
              images become windows back to your most precious day, moments you can relive whenever
              your heart desires. I pour my passion into every shot because I know these aren&apos;t
              just pictures &mdash; they&apos;re your legacy.
            </p>
            <p>
              From getting ready to the last dance, I capture the authentic, timeless moments that
              make your day uniquely yours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* EDITORIAL — image left / text right */}
      <section className="section-pad-lg relative overflow-hidden bg-[#0a0a0a]">
        <div className="pointer-events-none absolute right-0 top-0 select-none p-12 opacity-[0.03]">
          <span className="font-display text-[18rem] leading-none text-white">ILS</span>
        </div>
        <div className="mx-auto max-w-[1440px] px-6 md:px-12">
          <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2 md:gap-24">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 -translate-x-5 -translate-y-5 border border-[#d4af37]/25" />
              <img
                src={UPLOADS.story3}
                alt="In Lexi Studio — preserving your legacy"
                loading="lazy"
                decoding="async"
                className="relative h-[520px] w-full object-cover grayscale transition-all duration-700 hover:grayscale-0 md:h-[600px]"
              />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <p className="eyebrow-text mb-3 uppercase text-[#d4af37]">Every Celebration</p>
              <h2 className="display-section-title mb-8 font-display text-white">
                Your story,
                <br className="hidden md:block" /> told with heart
              </h2>
              <div className="space-y-5 text-[1.05rem] leading-relaxed text-gray-400">
                <p>
                  Whether it&apos;s an intimate ceremony or a grand celebration, I approach every
                  event with the same devotion and artistry. I specialise in weddings and
                  receptions, but I&apos;m equally passionate about capturing any meaningful
                  occasion &mdash; anniversaries, milestone birthdays, engagement parties, or
                  intimate family gatherings.
                </p>
                <motion.blockquote
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  className="mt-8 border-l-2 border-[#d4af37] py-2 pl-8"
                >
                  <p className="display-lead font-serif italic text-white">
                    These aren&apos;t just photos &mdash; they&apos;re the memories your family will
                    cherish for generations to come.
                  </p>
                </motion.blockquote>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CLOSING STATEMENT */}
      <div className="section-pad container mx-auto max-w-6xl px-6 md:px-10">
        <section className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="cta-glow-box relative overflow-hidden p-12"
          >
            <div className="absolute left-0 top-0 h-20 w-20 border-l border-t border-[#d4af37]/30" />
            <div className="absolute bottom-0 right-0 h-20 w-20 border-b border-r border-[#d4af37]/30" />

            <h3 className="display-card-title mb-6 font-display text-white">
              &ldquo;Your story deserves to be told with authenticity and grace.&rdquo;
            </h3>
            <a href="/contact" className="btn-secondary">
              Start The Conversation
            </a>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
