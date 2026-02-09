import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Heart, Clock, Users, Sun, Star } from 'lucide-react';
import type { Page } from '../../lib/api';
import { getImageUrl } from '../../lib/api';

interface Props {
  page: Page;
}

const scaleUp = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function WeddingPhotography({ page }: Props) {
  return (
    <div className="min-h-screen bg-[#080808] font-sans text-[#fcfcfc]">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden md:h-[75vh]">
        {page.hero_image && (
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: 'easeOut' }}
            src={getImageUrl(page.hero_image)}
            alt={page.title || 'Wedding Photography'}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#080808]" />

        <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleUp}
            className="max-w-4xl"
          >
            <h1 className="mb-6 bg-gradient-to-r from-[#d4af37] via-[#f3eacb] to-[#c5a059] bg-clip-text font-display text-5xl text-transparent drop-shadow-lg md:text-7xl lg:text-8xl">
              {page.title}
            </h1>
            {page.meta_description && (
              <p className="mx-auto max-w-2xl text-lg font-light tracking-wide text-gray-200 md:text-2xl">
                {page.meta_description}
              </p>
            )}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 100 }}
              className="mx-auto mt-12 h-24 w-[1px] bg-gradient-to-b from-[#d4af37] to-transparent"
            />
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        {/* Intro Text - Potentially from DB content or hardcoded hook */}
        <section className="mb-24 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mx-auto max-w-3xl"
          >
            <h2 className="mb-8 font-display text-3xl text-[#d4af37] md:text-4xl">
              Capturing the Soul of Your Celebration
            </h2>
            <p className="text-lg leading-relaxed text-gray-300">
              Wedding photography is more than just taking pictures; it's about preserving the
              fleeting moments that weave the story of your love. Based in Glasgow, I combine
              editorial finesse with documentary honesty to create a visual legacy you'll cherish
              forever.
            </p>
          </motion.div>
        </section>

        {/* The Process: Before / During / After */}
        <section className="mb-32">
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mb-16 text-center text-sm uppercase tracking-[0.3em] text-[#d4af37] md:text-base"
          >
            The Experience
          </motion.h3>

          <div className="relative grid grid-cols-1 gap-12 md:grid-cols-3">
            {/* Connecting Line (Desktop) */}
            <div className="absolute left-0 right-0 top-12 -z-10 hidden h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent md:block" />

            {/* Step 1: Before */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="group relative rounded-sm border border-[#ffffff]/5 bg-[#0f0f0f] p-8 transition-colors duration-500 hover:border-[#d4af37]/30"
            >
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-[#d4af37] bg-[#080808] shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-shadow group-hover:shadow-[0_0_25px_rgba(212,175,55,0.2)]">
                <Users className="h-10 w-10 text-[#d4af37]" strokeWidth={1.5} />
              </div>
              <h4 className="mb-4 text-center font-display text-2xl text-white">
                Before Your Wedding
              </h4>
              <ul className="space-y-4 text-sm leading-relaxed text-gray-400">
                <li>
                  <strong className="text-[#c5a059]">Discovery Call:</strong> Let's get to know each
                  other! I'll learn about your vision and ensure we're a perfect match.
                </li>
                <li>
                  <strong className="text-[#c5a059]">Engagement Session:</strong> A chance to get
                  comfortable in front of the camera before the big day.
                </li>
                <li>
                  <strong className="text-[#c5a059]">Planning Support:</strong> From timeline
                  creation to lighting tips, I'm here to guide you.
                </li>
              </ul>
            </motion.div>

            {/* Step 2: During */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ delay: 0.2 }}
              className="group relative rounded-sm border border-[#ffffff]/5 bg-[#0f0f0f] p-8 transition-colors duration-500 hover:border-[#d4af37]/30"
            >
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-[#d4af37] bg-[#080808] shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-shadow group-hover:shadow-[0_0_25px_rgba(212,175,55,0.2)]">
                <Camera className="h-10 w-10 text-[#d4af37]" strokeWidth={1.5} />
              </div>
              <h4 className="mb-4 text-center font-display text-2xl text-white">
                Your Wedding Day
              </h4>
              <ul className="space-y-4 text-sm leading-relaxed text-gray-400">
                <li>
                  <strong className="text-[#c5a059]">Unobtrusive Presence:</strong> I blend
                  seamlessly into your celebration, capturing genuine moments.
                </li>
                <li>
                  <strong className="text-[#c5a059]">Attention to Detail:</strong> From intricate
                  lace to tearful smiles, nothing goes unnoticed.
                </li>
                <li>
                  <strong className="text-[#c5a059]">Gentle Direction:</strong> Guidance for
                  portraits when needed, letting natural moments unfold.
                </li>
              </ul>
            </motion.div>

            {/* Step 3: After */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ delay: 0.4 }}
              className="group relative rounded-sm border border-[#ffffff]/5 bg-[#0f0f0f] p-8 transition-colors duration-500 hover:border-[#d4af37]/30"
            >
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-[#d4af37] bg-[#080808] shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-shadow group-hover:shadow-[0_0_25px_rgba(212,175,55,0.2)]">
                <Heart className="h-10 w-10 text-[#d4af37]" strokeWidth={1.5} />
              </div>
              <h4 className="mb-4 text-center font-display text-2xl text-white">
                After Your Wedding
              </h4>
              <ul className="space-y-4 text-sm leading-relaxed text-gray-400">
                <li>
                  <strong className="text-[#c5a059]">The Reveal:</strong> Receive a sneak peek
                  within 48 hours to share the excitement.
                </li>
                <li>
                  <strong className="text-[#c5a059]">Online Gallery:</strong> A private, beautiful
                  gallery to share with friends and family.
                </li>
                <li>
                  <strong className="text-[#c5a059]">Heirlooms:</strong> Design exquisite albums and
                  prints to preserve your legacy.
                </li>
              </ul>
            </motion.div>
          </div>
        </section>

        {/* Session Types Grid */}
        <section>
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mb-16 text-center text-sm uppercase tracking-[0.3em] text-[#d4af37] md:text-base"
          >
            Curated Collections
          </motion.h3>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="group relative h-[400px] cursor-pointer overflow-hidden">
              <img
                src="https://inlexistudio.com/wp-content/uploads/2023/07/In-Lexi-Studio-Wedding-Photography-Glasgow-Scotland-1-15.jpg"
                alt="Full Day Coverage"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/50 transition-colors group-hover:bg-black/40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <h4 className="mb-2 font-display text-3xl text-white">Full Day Coverage</h4>
                <p className="translate-y-4 transform text-gray-200 opacity-0 transition-all delay-100 duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  From preparations to the first dance.
                </p>
              </div>
            </div>

            <div className="group relative h-[400px] cursor-pointer overflow-hidden">
              <img
                src="https://inlexistudio.com/wp-content/uploads/2023/11/In-Lexi-Studio-Wedding-Photography-Glasgow-Scotland-1-1.jpg"
                alt="Elopements"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/50 transition-colors group-hover:bg-black/40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <h4 className="mb-2 font-display text-3xl text-white">Elopements</h4>
                <p className="translate-y-4 transform text-gray-200 opacity-0 transition-all delay-100 duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  Intimate celebrations for just the two of you.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
