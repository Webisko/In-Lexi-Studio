import React from 'react';
import { motion } from 'framer-motion';
import { Waves, Languages, Orbit, Quote } from 'lucide-react';
import type { Page } from '../../lib/api';
import { getImageSizes, getImageSrcSet, getImageUrl } from '../../lib/api';

interface Props {
  page: Page;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.9 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const UPLOADS = {
  alexPortrait: getImageUrl('/uploads/alex-4.webp'),
  mePortrait1: getImageUrl('/uploads/me-1.webp'),
  mePortrait2: getImageUrl('/uploads/me-2.webp'),
  wedding1: getImageUrl('/uploads/ils-100.webp'),
  wedding2: getImageUrl('/uploads/ils-154.webp'),
  wedding3: getImageUrl('/uploads/ils-40.webp'),
  wedding4: getImageUrl('/uploads/ils-185.webp'),
  wedding5: getImageUrl('/uploads/ils-206.webp'),
  wedding6: getImageUrl('/uploads/ils-212.webp'),
  wedding7: getImageUrl('/uploads/ils-218.webp'),
  portrait1: getImageUrl('/uploads/ilsp-4.webp'),
  portrait2: getImageUrl('/uploads/ilsp-15.webp'),
  portrait3: getImageUrl('/uploads/ilsp-16.webp'),
  portrait4: getImageUrl('/uploads/ilsp-25.webp'),
};

export default function About({ page }: Props) {
  const aboutOriginImages =
    Array.isArray(page.about_origin_images) && page.about_origin_images.length >= 3
      ? page.about_origin_images.slice(0, 3).map((item) => getImageUrl(item))
      : [UPLOADS.wedding1, UPLOADS.wedding3, UPLOADS.wedding2];

  const aboutStoryImages =
    Array.isArray(page.about_story_images) && page.about_story_images.length >= 3
      ? page.about_story_images.slice(0, 3).map((item) => getImageUrl(item))
      : [UPLOADS.alexPortrait, UPLOADS.wedding2, UPLOADS.mePortrait2];

  const aboutStoryCaptions =
    Array.isArray(page.about_story_captions) && page.about_story_captions.length >= 3
      ? page.about_story_captions.slice(0, 3)
      : ['Gliwice, Poland', 'One of many stories', 'Glasgow, Scotland'];

  const aboutWorkImages =
    Array.isArray(page.about_work_images) && page.about_work_images.length >= 3
      ? page.about_work_images.slice(0, 3).map((item) => getImageUrl(item))
      : [UPLOADS.wedding4, UPLOADS.wedding5, UPLOADS.wedding6];

  return (
    <div className="min-h-screen bg-[#080808] font-sans text-[#fcfcfc]">
      {/* 0. HERO */}
      <div
        data-page-hero
        className="relative h-[75vh] min-h-[560px] w-full overflow-hidden md:h-[90vh]"
      >
        {page.hero_image && (
          <motion.img
            initial={{ opacity: 0.72 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            src={getImageUrl(page.hero_image)}
            srcSet={getImageSrcSet(page.hero_image) || undefined}
            sizes={getImageSrcSet(page.hero_image) ? getImageSizes('hero') : undefined}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            alt={page.title}
            className="absolute inset-0 h-full w-full object-cover object-center will-change-transform"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080808]/10 to-[#080808]/35" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#080808]/30 to-[#080808]" />

        <div className="absolute inset-0 flex items-end justify-center px-4 pb-28 text-center md:pb-32">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-[#d4af37] via-[#f3eacb] to-[#c5a059] bg-clip-text font-display text-5xl text-transparent drop-shadow-lg md:text-7xl"
          >
            {page.title}
          </motion.h1>
        </div>

        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-4">
          <div className="relative h-12 w-[1px] overflow-hidden bg-white/20">
            <div className="landing-scroll-line absolute left-0 top-0 h-1/2 w-full bg-white" />
          </div>
          <p className="font-display text-[10px] uppercase tracking-[0.3em] text-white/80">
            Scroll
          </p>
        </div>
      </div>

      {/* 1. OPENING STATEMENT */}
      <section className="section-pad">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="mx-auto max-w-3xl px-6 text-center"
        >
          <p className="mb-6 text-sm uppercase tracking-[0.3em] text-[#d4af37]">
            Let me introduce myself
          </p>
          <p className="font-serif text-2xl italic leading-relaxed text-white/90 md:text-3xl">
            &ldquo;Empathy and curiosity have been my compass since childhood &mdash; they guide
            every frame I take.&rdquo;
          </p>
          <div className="mx-auto mt-8 h-[1px] w-16 bg-[#d4af37]/60" />
        </motion.div>
      </section>

      {/* 2. ORIGIN — editorial 2-col with offset portrait pair */}
      <section className="section-pad bg-[#0a0a0a]">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12">
          <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-[1fr_420px] lg:gap-24">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="flex flex-col justify-center"
            >
              <p className="mb-4 font-display text-[6rem] leading-none text-white/[0.04] md:text-[9rem]">
                01
              </p>
              <h2 className="mb-8 font-display text-3xl leading-tight text-white md:text-4xl">
                From North Africa
                <br className="hidden lg:block" /> to the Heart of Scotland
              </h2>
              <div className="space-y-5 text-[1.05rem] leading-relaxed text-gray-400">
                <p>
                  Born in Poland and raised in Algeria, my childhood in North Africa gifted me with
                  my most cherished memories. Growing up between different cultures shaped my
                  outlook, fostering openness, curiosity, and appreciation for human uniqueness.
                </p>
                <p>
                  As a teenager back in Gliwice, I discovered a passion for sports and developed a
                  deep appreciation for cinema and music. The works of David Lynch and Stanley
                  Kubrick, alongside both alternative and classical music, significantly influenced
                  my artistic sensibility.
                </p>
              </div>
            </motion.div>

            {/* Portrait with gold offset frame — desktop */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 border border-[#d4af37]/25 lg:translate-x-5 lg:translate-y-5" />
              <img
                src={UPLOADS.portrait4}
                alt="Alex — photographer portrait"
                loading="lazy"
                decoding="async"
                className="relative h-[460px] w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
              />
            </motion.div>

            {/* Mobile: portrait */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="overflow-hidden lg:hidden"
            >
              <img
                src={UPLOADS.portrait4}
                alt="Alex — photographer portrait"
                loading="lazy"
                decoding="async"
                className="h-80 w-full object-cover object-top"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. THREE-IMAGE ROW */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-3"
      >
        {aboutOriginImages.map((src, i) => (
          <motion.div key={i} variants={fadeInUp} className="overflow-hidden">
            <img
              src={src}
              alt={'In Lexi Studio — wedding ' + (i + 1)}
              loading="lazy"
              decoding="async"
              className="h-[40vh] w-full object-cover transition-transform duration-700 hover:scale-105 md:h-[55vh]"
            />
          </motion.div>
        ))}
      </motion.div>

      {/* 4. DISCOVERY + BLOCKQUOTE */}
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
              Photography entered my life at a perfect time as a beautiful discovery, and it quickly
              blossomed into my creative sanctuary &mdash; a wonderful portal to realms where my
              imagination runs wild.
            </p>
            <p>
              After completing my photography degree, I realized how all my previous experiences
              converged to shape me as an artist.
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
              &bdquo;My journey has shaped how I see the world through my lens. Years of working in
              social settings have given me an intuition for human connection and the quiet ability
              to anticipate special moments.&ldquo;
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
              My love of languages and cultural exploration brings an understanding of diverse
              traditions, while my passion for visual storytelling guides my artistic approach.
            </p>
            <p>
              On your wedding day, I become part of the natural flow &mdash; a calm presence
              capturing your celebration with both precision and heart, preserving the authentic
              essence of your unique story.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 5. PORTRAIT TRIPTYCH — editorial captions */}
      <section className="section-pad bg-[#0a0a0a]">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-1 md:gap-2"
          >
            {(
              aboutStoryImages.map((src, index) => ({
                src,
                caption: aboutStoryCaptions[index] || `Photo ${index + 1}`,
              })) as { src: string; caption: string }[]
            ).map((photo, i) => (
              <motion.div key={i} variants={fadeInUp} className="group flex flex-col gap-3">
                <div className="overflow-hidden">
                  <img
                    src={photo.src}
                    alt={photo.caption}
                    loading="lazy"
                    decoding="async"
                    className="h-56 w-full object-cover object-top grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 md:h-80"
                  />
                </div>
                <p className="text-center text-xs uppercase tracking-[0.2em] text-gray-400">
                  {photo.caption}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 6. LIVING FULLY — chapter with border-t-2 cards + ILS watermark */}
      <section className="section-pad-lg relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 select-none p-12 opacity-[0.03]">
          <span className="font-display text-[15rem] leading-none text-white sm:text-[18rem]">
            ILS
          </span>
        </div>

        <div className="relative z-10 mx-auto max-w-[1440px] px-6 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-16"
          >
            <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#d4af37]">
              Where Passion Meets Purpose
            </p>
            <h2 className="font-display text-3xl text-white md:text-5xl">Living Fully</h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            {(
              [
                {
                  Icon: Waves,
                  title: 'Movement',
                  text: "Physical movement fuels my spirit, particularly my passion for water sports. Years of open water swimming have taught me the pure joy of working with natural elements — a masterclass in finding harmony with nature's raw power.",
                },
                {
                  Icon: Languages,
                  title: 'Language',
                  text: 'My work as a French teacher has deepened my conviction that language — whether spoken or captured through a lens — serves as our bridge to understanding others and exploring our shared world.',
                },
                {
                  Icon: Orbit,
                  title: 'Mindfulness',
                  text: 'The foundation of my well-being rests on my daily practice of Qigong, Gulun Kung Fu, and meditation. These bring a beautiful integration of clarity, creativity, and inner peace that enriches everything I do.',
                },
              ] as {
                Icon: React.ComponentType<{
                  size?: number;
                  strokeWidth?: number;
                  className?: string;
                }>;
                title: string;
                text: string;
              }[]
            ).map(({ Icon, title, text }, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group relative border-2 border-[#ffffff]/5 border-t-[#d4af37] bg-[#0f0f0f] p-8 transition-all duration-500 hover:border-[#d4af37] hover:bg-[#111] md:p-10"
              >
                <div className="absolute right-0 top-0 origin-top-right scale-100 p-4 opacity-10 transition-all duration-500 group-hover:scale-125 group-hover:opacity-25">
                  <Icon size={64} className="text-[#d4af37]" />
                </div>
                <div className="mb-6 text-[#d4af37]">
                  <Icon size={28} strokeWidth={1.5} />
                </div>
                <h3 className="mb-4 font-display text-2xl text-white">{title}</h3>
                <p className="leading-relaxed text-gray-400">{text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 8. PASSION & PURPOSE — 02 editorial + tall portrait */}
      <section className="section-pad-lg bg-[#0a0a0a]">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12">
          <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2 md:gap-24">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative overflow-hidden md:overflow-visible"
            >
              <div className="absolute inset-0 border border-[#d4af37]/25 md:-translate-x-5 md:-translate-y-5" />
              <img
                src={UPLOADS.portrait1}
                alt="Passion for photography"
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
              <p className="mb-2 font-display text-[5rem] leading-none text-white/[0.04] md:text-[7rem]">
                02
              </p>
              <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#d4af37]">
                Passion &amp; Purpose
              </p>
              <h2 className="mb-8 font-display text-3xl leading-tight text-white md:text-4xl">
                What excites me most about my work?
              </h2>
              <div className="space-y-5 text-[1.05rem] leading-relaxed text-gray-400">
                <p>
                  Witnessing how my skills actually make a real difference in people&apos;s lives.
                  There&apos;s nothing quite like that incredible moment when I realize something I
                  created brought joy or value to someone else. That&apos;s what truly energizes me
                  every single day.
                </p>
                <p>
                  My endless curiosity about people and their unique stories continues to be my
                  greatest source of creative inspiration. I&apos;ve found that when we approach our
                  work with authentic joy and mindfulness, it naturally shines through in everything
                  we create.
                </p>
                <motion.blockquote
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  className="border-l-2 border-[#d4af37] py-2 pl-8"
                >
                  <p className="font-serif text-xl italic leading-relaxed text-white md:text-2xl">
                    For me, success goes beyond professional achievements &mdash; it&apos;s about
                    living with genuine purpose and staying present in each moment.
                  </p>
                </motion.blockquote>
                <p>
                  Finding motivation and fulfilment in knowing my skills create value and happiness
                  for others is deeply rewarding and continues to inspire my work.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 9. WORK GALLERY STRIP — full bleed 3-up */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-3"
      >
        {aboutWorkImages.map((src, i) => (
          <motion.div key={i} variants={fadeInUp} className="overflow-hidden">
            <img
              src={src}
              alt={'In Lexi Studio — work ' + (i + 1)}
              loading="lazy"
              decoding="async"
              className="h-[40vh] w-full object-cover transition-transform duration-700 hover:scale-105 md:h-[55vh]"
            />
          </motion.div>
        ))}
      </motion.div>

      {/* 10. WHEN NOT SHOOTING */}
      <section className="section-pad-lg">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12">
          <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2 md:gap-24">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <p className="mb-2 font-display text-[5rem] leading-none text-white/[0.04] md:text-[7rem]">
                03
              </p>
              <h2 className="mb-8 font-display text-3xl leading-tight text-white md:text-4xl">
                When I&apos;m not shooting
              </h2>
              <div className="space-y-5 text-[1.05rem] leading-relaxed text-gray-400">
                <p>
                  My love for nature draws me to hiking trails and traveling to new destinations,
                  where I can discover different lands and immerse myself in diverse cultures.
                  There&apos;s something magical about experiencing how people live and connect
                  across the world.
                </p>
                <p>
                  When I&apos;m not exploring new places, you&apos;ll find me on the tennis or
                  badminton court, or behind my drum kit. Playing with my boys in the band gives me
                  incredible satisfaction &mdash; there&apos;s nothing quite like losing yourself in
                  rhythm and music with close friends.
                </p>
                <p>
                  What I find deeply satisfying is taking the time to really explore and deepen my
                  understanding of everything around me &mdash; through conversations with locals,
                  quiet moments in unfamiliar places, or connecting through the universal language
                  of music.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative overflow-hidden md:overflow-visible"
            >
              <div className="absolute inset-0 border border-[#d4af37]/25 md:translate-x-5 md:translate-y-5" />
              <img
                src={UPLOADS.mePortrait1}
                alt="Photographer off duty"
                loading="lazy"
                decoding="async"
                className="relative h-[520px] w-full object-cover grayscale transition-all duration-700 hover:grayscale-0 md:h-[580px]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 11. CTA */}
      <section className="section-pad-lg bg-[#0a0a0a]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="mx-auto max-w-2xl px-6 text-center"
        >
          <Quote className="mx-auto mb-8 block h-8 w-8 text-[#d4af37]/40" />
          <h2 className="mb-4 font-serif text-2xl italic leading-relaxed text-white/90 md:text-3xl">
            I&apos;m always excited to connect with others who share this curiosity about exploring
            life more mindfully.
          </h2>
          <p className="mb-10 text-[1.05rem] leading-relaxed text-gray-400">
            Want to chat about your story and how we can create something meaningful together? Drop
            me a line.
          </p>
          <a href="/contact" className="btn-secondary">
            Get In Touch
          </a>
        </motion.div>
      </section>
    </div>
  );
}
