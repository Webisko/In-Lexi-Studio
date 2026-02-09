import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Coffee, Camera, Heart, Globe, Music } from 'lucide-react';
import type { Page } from '../../lib/api';
import { getImageSizes, getImageSrcSet, getImageUrl } from '../../lib/api';

interface Props {
  page: Page;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function About({ page }: Props) {
  return (
    <div className="min-h-screen bg-[#080808] font-sans text-[#fcfcfc]">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden md:h-[70vh]">
        {page.hero_image && (
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: 'easeOut' }}
            src={getImageUrl(page.hero_image)}
            srcSet={getImageSrcSet(page.hero_image) || undefined}
            sizes={getImageSrcSet(page.hero_image) ? getImageSizes('hero') : undefined}
            alt={page.title}
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#080808]" />

        <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <h1 className="mb-6 bg-gradient-to-r from-[#d4af37] via-[#f3eacb] to-[#c5a059] bg-clip-text font-display text-5xl text-transparent drop-shadow-lg md:text-7xl">
              {page.title}
            </h1>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        {/* My Story Section - Side by Side */}
        <section className="mb-32">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="order-2 md:order-1"
            >
              <h2 className="mb-4 text-sm uppercase tracking-[0.3em] text-[#d4af37]">My Story</h2>
              <h3 className="mb-8 font-display text-3xl leading-tight text-white md:text-4xl">
                From North Africa to the Heart of Scotland
              </h3>
              <div className="space-y-6 text-lg leading-relaxed text-gray-300">
                <p>
                  Born in Poland and raised in the warmth of Algeria, my childhood in North Africa
                  gifted me with my most cherished memories. Growing up between different cultures
                  shaped my outlook, fostering openness, curiosity, and a deep appreciation for
                  human uniqueness.
                </p>
                <p>
                  Moving to Scotland marked a new chapter, where the dramatic landscapes and vibrant
                  cities captured my heart. Today, based in Glasgow, I bring that multicultural
                  perspective to my photography, seeing beauty in every connection and story.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative order-1 h-[500px] w-full md:order-2 md:h-[600px]"
            >
              <div className="absolute inset-0 z-0 translate-x-4 translate-y-4 transform border border-[#d4af37]/30" />
              <img
                src="https://inlexistudio.com/wp-content/uploads/2023/11/In-Lexi-Studio-Wedding-Photography-Glasgow-Scotland-1-1.jpg"
                alt="Portrait of the photographer"
                className="absolute inset-0 z-10 h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
              />
            </motion.div>
          </div>
        </section>

        {/* Living Fully - 3 Column Grid with Icons */}
        <section className="mb-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-16 text-center"
          >
            <h2 className="mb-6 font-display text-3xl text-white md:text-4xl">Living Fully</h2>
            <div className="mx-auto h-[1px] w-24 bg-[#d4af37]" />
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: Globe,
                title: 'Travel',
                desc: 'Exploring new places and cultures fuels my creativity.',
              },
              {
                icon: Coffee,
                title: 'Connection',
                desc: 'Meaningful conversations over good coffee (or wine).',
              },
              {
                icon: Music,
                title: 'Rhythm',
                desc: 'Finding the beat in life, from music to the streets of Glasgow.',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group border border-[#ffffff]/5 bg-[#0f0f0f] p-8 text-center transition-colors hover:border-[#d4af37]/40"
              >
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#1a1a1a] text-[#d4af37] transition-transform group-hover:scale-110">
                  <item.icon size={28} strokeWidth={1.5} />
                </div>
                <h4 className="mb-3 font-display text-xl text-white">{item.title}</h4>
                <p className="text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* My Passion - Text + Image Flipped */}
        <section className="mb-16">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative h-[500px] w-full md:h-[600px]"
            >
              <div className="absolute inset-0 z-0 -translate-x-4 -translate-y-4 transform border border-[#d4af37]/30" />
              <img
                src="https://inlexistudio.com/wp-content/uploads/2023/07/In-Lexi-Studio-Wedding-Photography-Glasgow-Scotland-1-15.jpg"
                alt="Passion for photography"
                className="absolute inset-0 z-10 h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
              />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="mb-4 text-sm uppercase tracking-[0.3em] text-[#d4af37]">My Passion</h2>
              <h3 className="mb-8 font-display text-3xl leading-tight text-white md:text-4xl">
                Capturing the Unwritten
              </h3>
              <div className="space-y-6 text-lg leading-relaxed text-gray-300">
                <p>
                  Photography allows me to stop time. It's an archival process of feelings, distinct
                  and unrepeatable. I am driven by the desire to capture not just what something
                  looks like, but what it feels like.
                </p>
                <p>
                  Whether it's the quiet anticipation before a ceremony or the explosive joy of the
                  dance floor, my passion lies in documenting the authentic, raw, and beautiful
                  moments that define us.
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
