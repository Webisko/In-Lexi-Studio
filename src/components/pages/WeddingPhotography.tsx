import React from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';
import { Camera, Check, ChevronLeft, ChevronRight, Heart, MapPin, Users } from 'lucide-react';
import type { Page, Testimonial } from '../../lib/api';
import { getImageSizes, getImageSrcSet, getImageUrl } from '../../lib/api';
import { FAQSection } from '../FAQSection';
import { FormSuccessPanel } from '../FormSuccessPanel';
import { GallerySlider } from '../GallerySlider';
import { Lightbox } from '../Lightbox';
import { ServiceCrossLinks } from '../ServiceCrossLinks';
import { Testimonials } from '../Testimonials';

interface Props {
  page: Page;
  testimonials?: Testimonial[];
}

interface WeddingSessionType {
  title: string;
  image: string;
  description: string;
  items?: string[];
}

const scaleUp = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const defaultSessionTypes: WeddingSessionType[] = [
  {
    title: 'Getting Ready Session',
    image: getImageUrl('/uploads/ils-185.webp'),
    description:
      'A documentary-style shoot capturing the anticipation and preparation before the ceremony.',
    items: [
      'Bride and bridesmaids getting hair and makeup done',
      'Groom and groomsmen putting on suits',
      'Candid moments of nervous excitement',
      'Detail shots of wedding attire, jewellery, and accessories',
    ],
  },
  {
    title: 'Engagement Photoshoot',
    image: getImageUrl('/uploads/ils-195.webp'),
    description:
      'A relaxed pre-wedding session — our chance to work together so you feel completely at ease in front of my camera before the big day.',
    items: [
      'Casual and romantic outdoor locations',
      'Urban settings in Glasgow or scenic Scottish landscapes',
      'Perfect images for save-the-date cards',
    ],
  },
  {
    title: 'Traditional Ceremony Coverage',
    image: getImageUrl('/uploads/ils-212.webp'),
    description:
      'Discreet, full coverage of your ceremony — from the first arrival to the final kiss.',
    items: [
      'Processional and recessional',
      'Exchange of vows and rings',
      'Reactions of family and guests',
      'Formal family group portraits',
    ],
  },
  {
    title: "Couple's Romantic Portraits",
    image: getImageUrl('/uploads/ils-197.webp'),
    description:
      'A dedicated window of time during your day for relaxed, intimate portraits of just the two of you.',
    items: [
      'Golden hour photography',
      'Dramatic landscape backgrounds',
      'Intimate, romantic poses',
    ],
  },
  {
    title: 'Reception Reportage',
    image: getImageUrl('/uploads/ils-206.webp'),
    description:
      'Pure documentary coverage of your reception — speeches, first dance, and everything in between.',
    items: ['First dance', 'Speeches and toasts', 'Guest interactions', 'Dance floor energy'],
  },
  {
    title: 'Destination Wedding Coverage',
    image: getImageUrl('/uploads/ils-166.webp'),
    description:
      "Wherever your love story takes you, I'll be there with you to capture every moment.",
    items: [
      'Full-day or multi-day coverage',
      'Travel-friendly packages',
      'Comprehensive documentation of destination events',
    ],
  },
  {
    title: 'Sunrise / Sunset Session',
    image: getImageUrl('/uploads/ils-100.webp'),
    description:
      'A dedicated golden-hour shoot at your venue or a nearby location for truly ethereal light.',
    items: ['Golden hour timing', 'Romantic lighting conditions', 'Location selection and setup'],
  },
  {
    title: 'After-Wedding / Trash the Dress',
    image: getImageUrl('/uploads/ils-177.webp'),
    description:
      'An adventurous post-wedding shoot in your attire — relaxed, creative, and free from the timeline pressure of the day itself.',
    items: ['Creative outfit session', 'Adventurous locations', 'Fun and candid moments'],
  },
  {
    title: 'Micro-Wedding & Elopement Coverage',
    image: getImageUrl('/uploads/ils-154.webp'),
    description:
      'Intimate celebrations for just the two of you — or a small circle of loved ones in a landscape that moves you.',
    items: ['Intimate ceremony', 'Scenic couple portraits', 'Celebration with close loved ones'],
  },
];

const weddingFaqs = [
  {
    question: "Can't meet in person?",
    answer: [
      'We are always happy to meet with you in person.',
      'We can also meet via Skype or a similar video call.',
    ],
  },
  {
    question: 'Booking',
    answer: [
      'A deposit is needed to secure the date, with the amount depending on your chosen plan or individual needs.',
      'The smallest amount to secure a date is \u00A3250.',
    ],
  },
  {
    question: 'Payments and deposit',
    answer: [
      'Payment for your package is required two weeks before your big date. Full payments can be made by bank transfer or in cash.',
      'Additional products can always be purchased after the wedding by contacting us.',
      'Above prices include VAT; however, they do not include travel costs or postage for sending prints.',
    ],
  },
  {
    question: 'Wedding day coverage',
    answer: [
      'A standard full day of wedding coverage consists of 8 hours, and half day coverage lasts for 4 hours.',
      'If you would like different hours, please get in touch for a quote with some event details.',
    ],
  },
  {
    question: 'Family and group photos',
    answer: [
      'Nearly every client wants at least a few group photos, and we see this as a normal part of the day.',
      'We recommend keeping the number of group photos to around 7 so this part does not take over the day.',
      'Before your wedding, we will send you a guide with different ways to organize group photos so you get what you want.',
    ],
  },
  {
    question: 'Second photographer',
    answer: [
      'Having two photographers adds freshness and variety, and lets us be in two places at once.',
      'It also means we move around less; for example, during a ceremony we can have two viewpoints without moving, which is less obtrusive.',
    ],
  },
  {
    question: 'Travel',
    answer: [
      'We do not charge travel within a fifty mile range of Glasgow.',
      'For further afield, we do not charge travelling time, only expenses incurred.',
    ],
  },
  {
    question: 'Online gallery',
    answer: [
      'Online secured gallery available for you to view, download, and share with family and friends.',
      'Access is provided for 6 months.',
    ],
  },
];

function WeddingHighlightsSlider({ images, title }: { images: string[]; title: string }) {
  const originalImages = React.useMemo(
    () =>
      images.map((src, i) => ({
        id: i,
        src: getImageUrl(src),
        srcSet: getImageSrcSet(src),
        sizes: '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
        alt: `${title} highlight ${i + 1}`,
      })),
    [images, title],
  );
  const [currentIndex, setCurrentIndex] = React.useState(originalImages.length);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [slideWidthPx, setSlideWidthPx] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAnimationStop = React.useRef<(() => void) | null>(null);
  const dragStartX = React.useRef(0);
  const shouldSuppressClickRef = React.useRef(false);
  const lastDragAtRef = React.useRef(0);
  const slideWidthPxRef = React.useRef(0);
  const x = useMotionValue(0);

  const N = originalImages.length;
  const tripledImages = React.useMemo(
    () => [...originalImages, ...originalImages, ...originalImages],
    [originalImages],
  );

  React.useEffect(() => {
    setCurrentIndex(originalImages.length);
    setIsAnimating(false);
  }, [originalImages.length]);

  React.useEffect(() => {
    const updateSlideWidth = () => {
      const vw = window.innerWidth >= 1024 ? 33.333 : window.innerWidth >= 768 ? 50 : 100;
      const widthPx = (window.innerWidth * vw) / 100;
      slideWidthPxRef.current = widthPx;
      setSlideWidthPx(widthPx);
    };

    updateSlideWidth();
    window.addEventListener('resize', updateSlideWidth);
    return () => window.removeEventListener('resize', updateSlideWidth);
  }, []);

  React.useEffect(() => {
    if (isDragging || slideWidthPx === 0 || N === 0) return;
    const target = -currentIndex * slideWidthPx;
    setIsAnimating(true);
    const controls = animate(x, target, {
      duration: 0.85,
      ease: 'easeInOut',
      onComplete: () => setIsAnimating(false),
    });
    lastAnimationStop.current = () => controls.stop();
    return () => controls.stop();
  }, [currentIndex, isDragging, slideWidthPx, x, N]);

  React.useEffect(() => {
    if (isAnimating || N === 0) return;

    if (currentIndex >= N * 2) {
      setCurrentIndex((prev) => prev - N);
      if (slideWidthPxRef.current > 0) {
        x.set(x.get() + N * slideWidthPxRef.current);
      }
    } else if (currentIndex < N) {
      setCurrentIndex((prev) => prev + N);
      if (slideWidthPxRef.current > 0) {
        x.set(x.get() - N * slideWidthPxRef.current);
      }
    }
  }, [currentIndex, isAnimating, N, x]);

  React.useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isHovered && !isDragging && !lightboxOpen && N > 0) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 4500);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered, isDragging, lightboxOpen, N]);

  const go = (dir: number) => {
    setCurrentIndex((prev) => prev + dir);
  };

  const handleDragStart = (_event: unknown, info: { point: { x: number } }) => {
    if (lastAnimationStop.current) lastAnimationStop.current();
    setIsDragging(true);
    shouldSuppressClickRef.current = false;
    dragStartX.current = info.point.x;
  };

  const handleDrag = (_event: unknown, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) > 1) {
      shouldSuppressClickRef.current = true;
    }
  };

  const handleDragEnd = (
    _event: unknown,
    info: { point: { x: number }; offset: { x: number } },
  ) => {
    const widthPx =
      slideWidthPxRef.current ||
      (window.innerWidth >= 1024
        ? window.innerWidth / 3
        : window.innerWidth >= 768
          ? window.innerWidth / 2
          : window.innerWidth);
    const threshold = Math.min(140, Math.max(50, widthPx * 0.2));
    const dragDistance = Math.abs(info.point.x - dragStartX.current);
    if (dragDistance > 2) {
      shouldSuppressClickRef.current = true;
      lastDragAtRef.current = Date.now();
    }
    let delta = Math.round(-info.offset.x / widthPx);
    if (delta === 0 && dragDistance > threshold) {
      delta = info.offset.x < 0 ? 1 : -1;
    }

    setIsDragging(false);

    if (dragDistance > threshold && delta !== 0) {
      shouldSuppressClickRef.current = true;
      lastDragAtRef.current = Date.now();
      setCurrentIndex((prev) => prev + delta);
      return;
    }

    const target = -currentIndex * widthPx;
    setIsAnimating(true);
    const controls = animate(x, target, {
      duration: 0.35,
      ease: 'easeOut',
      onComplete: () => setIsAnimating(false),
    });
    lastAnimationStop.current = () => controls.stop();
  };

  if (!N) return null;

  const activeIndex = ((currentIndex % N) + N) % N;

  const lightboxImages = originalImages.map((item, i) => ({
    id: i,
    src: item.src,
    alt: item.alt,
  }));

  return (
    <section className="mb-28">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mb-10 px-4 text-center"
      >
        <p className="text-sm uppercase tracking-[0.3em] text-[#d4af37]">Wedding Highlights</p>
      </motion.div>

      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Slides track */}
        <motion.div
          className="flex cursor-grab active:cursor-grabbing"
          style={{ x }}
          drag="x"
          dragElastic={0.1}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        >
          {tripledImages.map((image, i) => (
            <div
              key={`${image.id}-${i}`}
              className="relative h-[55vh] w-full flex-shrink-0 cursor-pointer md:h-[68vh] md:w-1/2 lg:w-1/3"
              onClick={() => {
                if (Date.now() - lastDragAtRef.current < 250) {
                  return;
                }
                if (shouldSuppressClickRef.current) {
                  shouldSuppressClickRef.current = false;
                  return;
                }
                setLightboxIndex(i % N);
                setLightboxOpen(true);
              }}
            >
              <img
                src={image.src}
                srcSet={image.srcSet || undefined}
                sizes={image.srcSet ? image.sizes : undefined}
                loading={i === N ? 'eager' : 'lazy'}
                decoding="async"
                alt={image.alt}
                data-lightbox="off"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#080808]/60" />
            </div>
          ))}
        </motion.div>

        {/* Counter */}
        <div className="absolute bottom-5 left-6 z-10 font-display text-xs tracking-[0.2em] text-white/70">
          <span className="text-[#d4af37]">{String(activeIndex + 1).padStart(2, '0')}</span>
          {' / '}
          {String(N).padStart(2, '0')}
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {originalImages.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(N + i);
              }}
              aria-label={`Slide ${i + 1}`}
              className={`h-[2px] transition-all duration-300 ${
                i === activeIndex ? 'w-8 bg-[#d4af37]' : 'w-4 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>

        {/* Prev / Next arrows */}
        <button
          onClick={() => go(-1)}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/25 bg-black/45 text-white transition-all hover:border-[#d4af37]/60 hover:bg-black/70 hover:text-[#d4af37]"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/25 bg-black/45 text-white transition-all hover:border-[#d4af37]/60 hover:bg-black/70 hover:text-[#d4af37]"
        >
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
      </div>
      <Lightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </section>
  );
}

function SessionTypesTabs({ sessionTypes }: { sessionTypes: WeddingSessionType[] }) {
  const [active, setActive] = React.useState(0);
  const session = sessionTypes[active];

  React.useEffect(() => {
    setActive(0);
  }, [sessionTypes]);

  if (!sessionTypes.length || !session) return null;

  return (
    <section>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <p className="eyebrow-text mb-3 uppercase text-[#d4af37]">What We Offer</p>
        <h2 className="display-section-title font-display text-white">
          Wedding Photography Session Types
        </h2>
        <div className="mx-auto mt-6 h-[1px] w-16 bg-[#d4af37]/50" />
      </motion.div>

      {/* Mobile: stacked title selector */}
      <div className="mb-4 flex flex-wrap gap-2 md:hidden">
        {sessionTypes.map((s, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`border px-3 py-2 font-display text-xs uppercase tracking-wider transition-colors ${
              i === active
                ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]'
                : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Desktop: split panel */}
      <div className="overflow-hidden border border-white/10 md:grid md:h-[680px] md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_400px]">
        {/* LEFT — image + description */}
        <div className="relative min-h-[480px] md:h-full">
          {/* Image cross-fades */}
          {sessionTypes.map((s, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-500"
              style={{
                opacity: i === active ? 1 : 0,
                pointerEvents: i === active ? 'auto' : 'none',
              }}
            >
              <img
                src={s.image}
                alt={s.title}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/95 via-[#080808]/40 to-transparent" />
            </div>
          ))}

          {/* Content overlay */}
          <div className="absolute inset-x-0 bottom-0 p-8 md:p-10">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="eyebrow-text mb-1 font-display text-[#d4af37]/70">
                {String(active + 1).padStart(2, '0')} /{' '}
                {String(sessionTypes.length).padStart(2, '0')}
              </p>
              <h3 className="display-card-title mb-3 font-display text-white">{session.title}</h3>
              <p className="body-copy max-w-2xl leading-relaxed text-gray-300">
                {session.description}
              </p>
              {session.items && session.items.length > 0 && (
                <ul className="mt-4 space-y-2 text-gray-400">
                  {session.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm leading-relaxed">
                      <span
                        aria-hidden="true"
                        className="inline-block h-1 w-1 flex-shrink-0 rounded-full bg-[#d4af37]"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </div>
        </div>

        {/* RIGHT — title list (desktop only) */}
        <div className="hidden divide-y divide-white/5 overflow-y-auto border-l border-white/10 bg-[#0a0a0a] md:block">
          {sessionTypes.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`group flex w-full items-center gap-4 px-7 py-6 text-left transition-all duration-200 ${
                i === active ? 'bg-[#0f0f0f]' : 'hover:bg-[#0d0d0d]'
              }`}
            >
              <span
                className={`font-display text-[0.6rem] tracking-[0.25em] transition-colors ${
                  i === active
                    ? 'text-[#d4af37]'
                    : 'text-[#d4af37]/25 group-hover:text-[#d4af37]/50'
                }`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={`flex-1 font-display text-base leading-snug transition-colors md:text-[1.05rem] ${
                  i === active ? 'text-[#d4af37]' : 'text-gray-400 group-hover:text-white'
                }`}
              >
                {s.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function WeddingPhotography({ page, testimonials = [] }: Props) {
  const contactApiUrl = `${import.meta.env.PUBLIC_API_URL || '/app/api'}/contact`;
  const [isSubmittingWeddingForm, setIsSubmittingWeddingForm] = React.useState(false);
  const [isWeddingFormSuccess, setIsWeddingFormSuccess] = React.useState(false);
  const sliderImages = page.wedding_slider_images || [];
  const weddingSliderItems = React.useMemo(
    () =>
      sliderImages.map((imagePath, index) => ({
        id: index + 1,
        image_path: imagePath,
        alt: `${page.title || 'Wedding'} highlight ${index + 1}`,
      })),
    [page.title, sliderImages],
  );
  const collectionImageOne =
    sliderImages[0] ||
    'https://images.unsplash.com/photo-1511285560982-1351cdeb9821?q=80&w=1000&auto=format&fit=crop';
  const collectionImageTwo =
    sliderImages[1] ||
    'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1000&auto=format&fit=crop';
  const faqItems =
    page.faq_items && page.faq_items.length > 0
      ? page.faq_items
      : weddingFaqs.map((faq) => ({
          question: faq.question,
          answer: faq.answer.map((line) => `<p>${line}</p>`).join(''),
        }));
  const weddingTestimonialIds = React.useMemo(
    () =>
      (Array.isArray(page.wedding_testimonial_ids) ? page.wedding_testimonial_ids : [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0),
    [page.wedding_testimonial_ids],
  );
  const weddingTestimonials = React.useMemo(() => {
    if (!Array.isArray(testimonials) || testimonials.length === 0) return [];
    if (weddingTestimonialIds.length === 0) return testimonials;
    const testimonialMap = new Map(testimonials.map((item) => [item.id, item]));
    return weddingTestimonialIds
      .map((id) => testimonialMap.get(id))
      .filter((item): item is Testimonial => Boolean(item));
  }, [testimonials, weddingTestimonialIds]);
  const weddingSubtitle =
    page.meta_description || 'Timeless wedding photography that tells your unique love story';
  const weddingSessionTypes = React.useMemo(() => {
    const fromCms = Array.isArray(page.wedding_session_types)
      ? page.wedding_session_types
          .map((item) => ({
            title: String(item?.title || '').trim(),
            description: String(item?.description || '').trim(),
            image: getImageUrl(item?.image || ''),
            items: Array.isArray(item?.items)
              ? item.items.map((listItem) => String(listItem || '').trim()).filter(Boolean)
              : [],
          }))
          .filter((item) => item.title || item.description || item.image || item.items.length > 0)
      : [];

    return fromCms.length > 0 ? fromCms : defaultSessionTypes;
  }, [page.wedding_session_types]);

  const handleWeddingSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmittingWeddingForm) return;

    const form = event.currentTarget;
    setIsSubmittingWeddingForm(true);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
      });

      if (!response.ok) throw new Error('Request failed');
      form.reset();
      setIsWeddingFormSuccess(true);
    } catch (error) {
      window.alert('Sorry, the wedding form could not be sent. Please try again.');
    } finally {
      setIsSubmittingWeddingForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] font-sans text-[#fcfcfc]">
      {/* Hero Section */}
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
            alt={page.title || 'Wedding Photography'}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080808]/10 to-[#080808]/35" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#080808]/30 to-[#080808]" />

        <div className="absolute inset-0 flex items-end justify-center px-4 pb-28 text-center md:pb-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleUp}
            className="max-w-4xl"
          >
            <h1 className="display-hero mb-6 bg-gradient-to-r from-[#d4af37] via-[#f3eacb] to-[#c5a059] bg-clip-text font-display text-transparent drop-shadow-lg">
              {page.title}
            </h1>
            <p className="display-subtitle mx-auto max-w-2xl font-light tracking-wide text-gray-200">
              {weddingSubtitle}
            </p>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-4">
          <div className="relative h-12 w-[1px] overflow-hidden bg-white/20">
            <div className="landing-scroll-line absolute left-0 top-0 h-1/2 w-full bg-white" />
          </div>
          <p className="scroll-indicator-text font-display uppercase text-white/80">Scroll</p>
        </div>
      </div>

      <div className="section-pad mx-auto w-full max-w-[1440px] px-6 md:px-10">
        {/* Intro Text - Potentially from DB content or hardcoded hook */}
        <section className="mb-24 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mx-auto max-w-3xl"
          >
            <h2 className="display-section-title mb-8 font-display text-white">
              Capturing the Soul of Your Celebration
            </h2>
            <p className="body-copy leading-relaxed text-gray-300">
              Wedding photography is more than just taking pictures; it's about preserving the
              fleeting moments that weave the story of your love. Based in Glasgow, I combine
              editorial finesse with documentary honesty to create a visual legacy you'll cherish
              forever.
            </p>
          </motion.div>
        </section>
      </div>

      {weddingSliderItems.length > 0 && (
        <section className="mb-28">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-10 px-4 text-center"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-[#d4af37]">Wedding Highlights</p>
          </motion.div>

          <GallerySlider
            data={{ wedding: weddingSliderItems }}
            categoryOverride="wedding"
            showCta={false}
          />
        </section>
      )}

      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">

        {/* The Process: Before / During / After */}
        <section className="mb-32">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <p className="eyebrow-text mb-3 uppercase text-[#d4af37]">The Experience</p>
            <h3 className="display-section-title font-display text-white">
              Before, During &amp; After
            </h3>
            <div className="mx-auto mt-6 h-[1px] w-16 bg-[#d4af37]/50" />
          </motion.div>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1: Before */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="group relative border-2 border-[#ffffff]/5 border-t-[#d4af37] bg-[#0f0f0f] p-8 transition-all duration-500 hover:-translate-y-1 hover:border-[#d4af37] hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] md:p-10"
            >
              <div className="absolute right-0 top-0 origin-top-right scale-100 p-4 opacity-10 transition-all duration-500 group-hover:scale-125 group-hover:opacity-25">
                <Users size={64} className="text-[#d4af37]" />
              </div>
              <div className="mb-6 text-[#d4af37]">
                <Users size={28} strokeWidth={1.5} />
              </div>
              <h4 className="display-card-title mb-4 font-display text-white">
                Before Your Wedding
              </h4>
              <ul className="body-copy space-y-4 leading-relaxed text-gray-400">
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
              className="group relative border-2 border-[#ffffff]/5 border-t-[#d4af37] bg-[#0f0f0f] p-8 transition-all duration-500 hover:-translate-y-1 hover:border-[#d4af37] hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] md:p-10"
            >
              <div className="absolute right-0 top-0 origin-top-right scale-100 p-4 opacity-10 transition-all duration-500 group-hover:scale-125 group-hover:opacity-25">
                <Camera size={64} className="text-[#d4af37]" />
              </div>
              <div className="mb-6 text-[#d4af37]">
                <Camera size={28} strokeWidth={1.5} />
              </div>
              <h4 className="mb-4 font-display text-2xl text-white">Your Wedding Day</h4>
              <ul className="body-copy space-y-4 leading-relaxed text-gray-400">
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
              className="group relative border-2 border-[#ffffff]/5 border-t-[#d4af37] bg-[#0f0f0f] p-8 transition-all duration-500 hover:-translate-y-1 hover:border-[#d4af37] hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] md:p-10"
            >
              <div className="absolute right-0 top-0 origin-top-right scale-100 p-4 opacity-10 transition-all duration-500 group-hover:scale-125 group-hover:opacity-25">
                <Heart size={64} className="text-[#d4af37]" />
              </div>
              <div className="mb-6 text-[#d4af37]">
                <Heart size={28} strokeWidth={1.5} />
              </div>
              <h4 className="mb-4 font-display text-2xl text-white">After Your Wedding</h4>
              <ul className="body-copy space-y-4 leading-relaxed text-gray-400">
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

        {/* Session Types */}
        <SessionTypesTabs sessionTypes={weddingSessionTypes} />

        {/* My Commitment */}
        <section className="mt-32">
          <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2 md:gap-24">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <p className="eyebrow-text mb-3 uppercase text-[#d4af37]">Why Choose Me</p>
              <h2 className="display-section-title mb-10 font-display text-white">
                My Commitment to
                <br className="hidden md:block" /> Your Wedding Day
              </h2>
              <ul className="space-y-5">
                {[
                  'Authentic storytelling approach',
                  'Natural, unposed moments combined with creative portraits',
                  'Experience with diverse wedding traditions and venues',
                  'Professional equipment and backup gear',
                  'Quick turnaround times',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-4 text-[1.05rem] text-gray-300">
                    <Check size={18} strokeWidth={2} className="mt-1 shrink-0 text-[#d4af37]" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="/contact" className="btn-secondary mt-12">
                Get In Touch
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative hidden md:block"
            >
              <div className="absolute inset-0 translate-x-5 translate-y-5 border border-[#d4af37]/25" />
              <img
                src={getImageUrl(collectionImageOne)}
                alt="In Lexi Studio — wedding commitment"
                loading="lazy"
                decoding="async"
                className="relative h-[520px] w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
              />
            </motion.div>
          </div>
        </section>

        {/* Available Locations */}
        <section className="mt-32">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <p className="eyebrow-text mb-3 uppercase text-[#d4af37]">Coverage Area</p>
            <h2 className="display-section-title font-display text-white">Available Locations</h2>
            <div className="mx-auto mt-6 h-[1px] w-16 bg-[#d4af37]/50" />
          </motion.div>

          <div className="overflow-hidden border border-white/10 md:grid md:grid-cols-2">
            {/* Map image */}
            <div className="relative h-72 overflow-hidden md:h-auto">
              <img
                src={getImageUrl('/uploads/glasgow-1.webp')}
                alt="Glasgow — wedding photography coverage map"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent from-[25%] via-[#080808]/40 via-[60%] to-[#080808]" />
            </div>

            {/* Location content */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="bg-[#0a0a0a] p-10 md:p-14"
            >
              <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#d4af37]">
                Based in Glasgow, Scotland
              </p>
              <p className="body-copy mb-10 leading-relaxed text-gray-400">
                I bring my wedding photography expertise to couples throughout the UK and beyond.
                While I primarily serve Scotland with its stunning landscapes and historic venues,
                I&apos;m happy to travel anywhere to capture your special day.
              </p>

              <div className="space-y-0">
                {(
                  [
                    {
                      label: 'Scotland',
                      detail: 'Full coverage — travel typically included in your package',
                      primary: true,
                    },
                    {
                      label: 'Rest of UK',
                      detail: 'England, Wales & Northern Ireland — minimal fee based on distance',
                      primary: false,
                    },
                    {
                      label: 'Europe',
                      detail: 'Destination weddings across Europe available upon discussion',
                      primary: false,
                    },
                    {
                      label: 'International',
                      detail: "Anywhere in the world — let's talk about your dream location",
                      primary: false,
                    },
                  ] as { label: string; detail: string; primary: boolean }[]
                ).map((loc, i, arr) => (
                  <div
                    key={i}
                    className={`flex items-start gap-4 py-5 ${
                      i < arr.length - 1 ? 'border-b border-white/5' : ''
                    }`}
                  >
                    <MapPin size={15} strokeWidth={1.5} className="mt-1 shrink-0 text-[#d4af37]" />
                    <div>
                      <p
                        className={`mb-1 font-display text-sm uppercase tracking-wider ${
                          loc.primary ? 'text-[#d4af37]' : 'text-white'
                        }`}
                      >
                        {loc.label}
                      </p>
                      <p className="text-sm leading-relaxed text-gray-400">{loc.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mt-24">
          <Testimonials data={weddingTestimonials} />

          <div className="mx-auto max-w-3xl rounded-sm border border-white/10 bg-white/[0.03] p-8 md:p-10">
            {isWeddingFormSuccess ? (
              <FormSuccessPanel
                title="Thank you for filling out the form."
                message="I will get back to you as soon as possible. You should usually hear from me within 48 hours."
                homeLabel="Back to Home"
              />
            ) : (
              <>
                <h3 className="mb-8 text-center font-display text-3xl text-white md:text-4xl">
                  Share Your Details
                </h3>

                <form
                  className="wedding-contact-form space-y-6"
                  name="wedding-contact"
                  method="POST"
                  action={contactApiUrl}
                  onSubmit={handleWeddingSubmit}
                >
                  <input type="hidden" name="formType" value="wedding" />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block font-display text-xs uppercase tracking-widest text-gold">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        name="your-name"
                        className="w-full rounded border border-white/10 bg-black/20 p-4 text-white outline-none transition-colors focus:border-gold"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-display text-xs uppercase tracking-widest text-gold">
                        Your Partner&apos;s Name *
                      </label>
                      <input
                        type="text"
                        name="partner-name"
                        className="w-full rounded border border-white/10 bg-black/20 p-4 text-white outline-none transition-colors focus:border-gold"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-display text-xs uppercase tracking-widest text-gold">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="contact-email"
                        className="w-full rounded border border-white/10 bg-black/20 p-4 text-white outline-none transition-colors focus:border-gold"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-display text-xs uppercase tracking-widest text-gold">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="contact-phone"
                        className="w-full rounded border border-white/10 bg-black/20 p-4 text-white outline-none transition-colors focus:border-gold"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-display text-xs uppercase tracking-widest text-gold">
                        Where are you based? *
                      </label>
                      <input
                        type="text"
                        name="location"
                        className="w-full rounded border border-white/10 bg-black/20 p-4 text-white outline-none transition-colors focus:border-gold"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-display text-xs uppercase tracking-widest text-gold">
                        Your Wedding Date *
                      </label>
                      <input
                        type="date"
                        name="date"
                        className="w-full rounded border border-white/10 bg-black/20 p-4 text-white outline-none transition-colors focus:border-gold"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-display text-xs uppercase tracking-widest text-gold">
                        Ceremony Venue Location *
                      </label>
                      <input
                        type="text"
                        name="venue"
                        className="w-full rounded border border-white/10 bg-black/20 p-4 text-white outline-none transition-colors focus:border-gold"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-display text-xs uppercase tracking-widest text-gold">
                        Ceremony Type *
                      </label>
                      <select
                        name="ceremony-type"
                        className="w-full rounded border border-white/10 bg-black/20 p-4 text-white outline-none transition-colors focus:border-gold"
                        required
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select ceremony type
                        </option>
                        <option value="religious">Religious</option>
                        <option value="civil">Civil</option>
                        <option value="symbolic">Symbolic</option>
                        <option value="elopement">Elopement</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block font-display text-xs uppercase tracking-widest text-gold">
                        Expected Guest Count *
                      </label>
                      <input
                        type="number"
                        name="guests"
                        className="w-full rounded border border-white/10 bg-black/20 p-4 text-white outline-none transition-colors focus:border-gold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-display text-xs uppercase tracking-widest text-gold">
                      How would you envision your wedding? *
                    </label>
                    <textarea
                      name="vision"
                      rows={4}
                      className="w-full rounded border border-white/10 bg-black/20 p-4 text-white outline-none transition-colors focus:border-gold"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-display text-xs uppercase tracking-widest text-gold">
                      Your Love Story *
                    </label>
                    <textarea
                      name="story"
                      rows={4}
                      className="w-full rounded border border-white/10 bg-black/20 p-4 text-white outline-none transition-colors focus:border-gold"
                      placeholder="I love the details! Tell me a little about you two, how you met, your interests and your plans for the big day. Share as much info as you like"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-display text-xs uppercase tracking-widest text-gold">
                      What attracted you to my work? *
                    </label>
                    <textarea
                      name="attraction"
                      rows={4}
                      className="w-full rounded border border-white/10 bg-black/20 p-4 text-white outline-none transition-colors focus:border-gold"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-display text-xs uppercase tracking-widest text-gold">
                      How did you find me? *
                    </label>
                    <select
                      name="found-me"
                      className="w-full rounded border border-white/10 bg-black/20 p-4 text-white outline-none transition-colors focus:border-gold"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select an option
                      </option>
                      <option value="google">Google Search</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="referral">Friend Referral</option>
                      <option value="wedding-planner">Wedding Planner</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <fieldset className="space-y-4 rounded border border-white/10 bg-black/20 p-4">
                    <legend className="px-1 font-display text-xs uppercase tracking-widest text-gold">
                      We would like to include
                    </legend>
                    <div className="grid grid-cols-1 gap-3 text-sm text-white sm:grid-cols-2">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="extras"
                          value="extra-session"
                          className="accent-[#c5a059]"
                        />
                        Extra Photo Session
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="extras"
                          value="albums-prints"
                          className="accent-[#c5a059]"
                        />
                        Albums &amp; Prints
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="extras"
                          value="express-editing"
                          className="accent-[#c5a059]"
                        />
                        Express Fast Editing (under 14 days)
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="extras"
                          value="after-party"
                          className="accent-[#c5a059]"
                        />
                        After Party Dinner
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="extras"
                          value="second-photographer"
                          className="accent-[#c5a059]"
                        />
                        Second Photographer
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="extras"
                          value="pre-wedding"
                          className="accent-[#c5a059]"
                        />
                        Pre-Wedding Photo Shoot
                      </label>
                    </div>
                  </fieldset>

                  <div>
                    <label className="mb-2 block font-display text-xs uppercase tracking-widest text-gold">
                      Any other questions or notes? We are here to help.
                    </label>
                    <textarea
                      name="questions"
                      rows={4}
                      className="w-full rounded border border-white/10 bg-black/20 p-4 text-white outline-none transition-colors focus:border-gold"
                    />
                  </div>

                  <label className="flex items-start gap-3 text-sm leading-relaxed text-white/80">
                    <input
                      type="checkbox"
                      name="gdpr-consent"
                      required
                      className="mt-1 accent-[#c5a059]"
                    />
                    <span>
                      In line with GDPR laws, I consent to you collecting my information as a part
                      of providing your service. The Privacy Policy can be found under
                      &quot;Info&quot; in the nav bar.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmittingWeddingForm}
                    className="btn-secondary w-full"
                  >
                    {isSubmittingWeddingForm ? 'Sending...' : 'Send Your Story'}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </div>

      <FAQSection
        items={faqItems}
        eyebrow="Wedding Questions"
        title="Wedding FAQ"
        titleClassName="text-5xl md:text-6xl"
      />

      <div className="px-6 md:px-10">
        <ServiceCrossLinks currentSlug="wedding-photography" />
      </div>
    </div>
  );
}
