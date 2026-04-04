import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Quote, X } from 'lucide-react';
import { Lightbox } from './Lightbox';
import type { Testimonial } from '../lib/api';
import { getImageSizes, getImageSrcSet, getImageUrl } from '../lib/api';

interface Moment {
  id: number;
  title: string;
  description?: string;
  testimonial?: Testimonial | null;
  image: string;
  images?: string[];
}

interface LatestMomentsProps {
  items?: Moment[];
  backgroundImage?: string | null;
}

const collapsedTextStyle: React.CSSProperties = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 5,
  overflow: 'hidden',
};

function ExpandableText({ content, className }: { content: string; className: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const [canExpand, setCanExpand] = React.useState(false);
  const textRef = React.useRef<HTMLParagraphElement | null>(null);

  React.useEffect(() => {
    setExpanded(false);
  }, [content]);

  React.useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const measure = () => {
      const previousDisplay = element.style.display;
      const previousBoxOrient = element.style.webkitBoxOrient;
      const previousLineClamp = element.style.webkitLineClamp;
      const previousOverflow = element.style.overflow;

      element.style.display = '-webkit-box';
      element.style.webkitBoxOrient = 'vertical';
      element.style.webkitLineClamp = '5';
      element.style.overflow = 'hidden';

      const nextCanExpand = element.scrollHeight - element.clientHeight > 1;

      element.style.display = previousDisplay;
      element.style.webkitBoxOrient = previousBoxOrient;
      element.style.webkitLineClamp = previousLineClamp;
      element.style.overflow = previousOverflow;

      setCanExpand(nextCanExpand);
    };

    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      if (element.parentElement) {
        observer.observe(element.parentElement);
      }
      return () => observer.disconnect();
    }

    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [content]);

  return (
    <div>
      <div className="relative">
        <p ref={textRef} className={className} style={expanded ? undefined : collapsedTextStyle}>
          {content}
        </p>
        {canExpand && !expanded ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#080808] via-[#080808]/80 to-transparent" />
        ) : null}
      </div>

      {canExpand ? (
        <button
          type="button"
          className="mt-4 text-xs uppercase tracking-[0.28em] text-[#d4af37] transition-colors hover:text-white"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      ) : null}
    </div>
  );
}

const moments: Moment[] = [
  {
    id: 1,
    title: 'Claire & Ryan',
    image:
      'https://images.unsplash.com/photo-1621621667797-e06afc21085c?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Alice & Alex',
    image:
      'https://images.unsplash.com/photo-1511285560982-1351cdeb9821?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Clair & John',
    image:
      'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 4,
    title: 'Chloe & Thomas',
    image:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 5,
    title: 'Lesleyann & Colin',
    image:
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 6,
    title: 'BillyJo & Martin',
    image:
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop',
  },
];

export const LatestMoments: React.FC<LatestMomentsProps> = ({ items, backgroundImage }) => {
  const resolvedItems = items && items.length > 0 ? items : moments;
  const [selectedSessionId, setSelectedSessionId] = React.useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const backgroundUrl = backgroundImage ? getImageUrl(backgroundImage) : '';
  const titleCellStyle = backgroundUrl
    ? {
        backgroundImage: `linear-gradient(to bottom right, rgba(0,0,0,0.62), rgba(0,0,0,0.45)), url(${backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  const selectedSession =
    selectedSessionId !== null ? resolvedItems.find((item) => item.id === selectedSessionId) : null;

  const sessionImages = (selectedSession?.images || [])
    .map((image, index) => ({
      id: index,
      src: getImageUrl(image),
      alt: `${selectedSession?.title || 'Session'} ${index + 1}`,
    }))
    .filter((item) => item.src);

  const closeSessionModal = React.useCallback(() => {
    setLightboxOpen(false);
    setSelectedSessionId(null);
    window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  }, []);

  React.useEffect(() => {
    if (!selectedSession && !lightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedSession, lightboxOpen]);

  const testimonialAvatar = selectedSession?.testimonial?.avatar_image
    ? getImageUrl(selectedSession.testimonial.avatar_image)
    : '';
  const testimonialAvatarSrcSet = selectedSession?.testimonial?.avatar_image
    ? getImageSrcSet(selectedSession.testimonial.avatar_image)
    : '';

  return (
    <>
      <section ref={sectionRef} id="latest-moments" className="relative w-full overflow-hidden">
        <div className="relative z-10 flex w-full flex-col md:grid md:h-[65vh] md:min-h-[520px] md:grid-cols-4 md:grid-rows-2">
          {/* Title cell - merged/spans 2 rows on desktop */}
          <div
            className="relative flex h-[180px] items-start justify-center bg-gradient-to-br from-black/60 to-black/40 p-10 text-center md:row-span-2 md:h-auto md:p-14"
            style={titleCellStyle}
          >
            <h2 className="text-center font-display text-[clamp(2rem,3.5vw,3.5rem)] leading-[0.95] tracking-wide text-white">
              LATEST
              <br />
              MOMENTS
            </h2>
          </div>

          {/* 6 image tiles */}
          {resolvedItems.map((moment) => {
            const resolvedImage = moment.image ? getImageUrl(moment.image) : '';
            const resolvedSrcSet = moment.image ? getImageSrcSet(moment.image) : '';
            const resolvedSizes = resolvedSrcSet ? getImageSizes('gallery') : undefined;
            const fallbackImage =
              'https://images.unsplash.com/photo-1511285560982-1351cdeb9821?q=80&w=1000&auto=format&fit=crop';

            return (
              <button
                key={moment.id}
                type="button"
                className="group relative h-[180px] cursor-pointer overflow-hidden text-left md:h-auto"
                onClick={() => setSelectedSessionId(moment.id)}
              >
                <div className="absolute inset-0 z-10 bg-black/25 transition-colors duration-500 group-hover:bg-black/10" />

                <img
                  src={resolvedImage || fallbackImage}
                  srcSet={resolvedSrcSet || undefined}
                  sizes={resolvedSizes}
                  alt={moment.title}
                  loading="lazy"
                  decoding="async"
                  data-lightbox="off"
                  className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />

                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-6">
                  <h3 className="text-center font-serif text-[clamp(1.5rem,2.5vw,2.5rem)] italic leading-tight text-white drop-shadow-lg">
                    {moment.title}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] overflow-y-auto bg-black/90 p-4 md:p-8"
            onClick={closeSessionModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="mx-auto mt-8 w-full max-w-6xl rounded border border-white/15 bg-[#080808] p-6 md:mt-12 md:p-10"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-8 flex items-start justify-between gap-4">
                <div className="flex max-w-4xl items-center gap-4 md:gap-5">
                  {testimonialAvatar ? (
                    <img
                      src={testimonialAvatar}
                      srcSet={testimonialAvatarSrcSet || undefined}
                      sizes={testimonialAvatarSrcSet ? getImageSizes('half') : undefined}
                      alt={selectedSession.testimonial?.author || selectedSession.title}
                      loading="lazy"
                      decoding="async"
                      data-lightbox="off"
                      className="h-12 w-12 shrink-0 rounded-full object-cover md:h-14 md:w-14"
                    />
                  ) : selectedSession.testimonial?.content ? (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#d4af37]/25 bg-black/20 text-[#d4af37] md:h-14 md:w-14">
                      <Quote size={18} strokeWidth={1.5} />
                    </div>
                  ) : null}

                  <h3 className="font-display text-3xl text-white md:text-5xl">
                    {selectedSession.title}
                  </h3>
                </div>
                <button
                  type="button"
                  className="text-white/70 transition-colors hover:text-gold"
                  onClick={closeSessionModal}
                  aria-label="Close session"
                >
                  <X size={30} strokeWidth={1.5} />
                </button>
              </div>

              {(selectedSession.description || selectedSession.testimonial?.content) && (
                <div className="mb-8 grid gap-4 lg:grid-cols-2 lg:items-start">
                  {selectedSession.description ? (
                    <div className="flex flex-col self-start rounded-sm border border-white/10 bg-white/[0.03] p-5 md:p-6">
                      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.26em] text-white/70 md:text-base">
                        Session Review
                      </p>
                      <ExpandableText
                        content={selectedSession.description}
                        className="text-white/86 font-sans text-base leading-relaxed md:text-lg"
                      />
                    </div>
                  ) : null}

                  {selectedSession.testimonial?.content ? (
                    <div className="flex flex-col self-start rounded-sm border border-[#d4af37]/20 bg-[#16120a] p-5 md:p-6">
                      <div className="mb-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#d4af37]/90 md:text-base">
                          Client Review
                        </p>
                      </div>

                      <ExpandableText
                        content={selectedSession.testimonial.content}
                        className="font-serif text-lg leading-relaxed text-[#f3ead5] md:text-xl"
                      />
                    </div>
                  ) : null}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sessionImages.map((image, index) => {
                  const srcSet = getImageSrcSet(image.src);
                  const sizes = srcSet ? getImageSizes('gallery') : undefined;
                  return (
                    <button
                      key={`${image.id}-${index}`}
                      type="button"
                      className="group relative overflow-hidden"
                      onClick={() => {
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                      }}
                    >
                      <img
                        src={image.src}
                        srcSet={srcSet || undefined}
                        sizes={sizes}
                        alt={image.alt}
                        loading="lazy"
                        decoding="async"
                        data-lightbox="off"
                        className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-72"
                      />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Lightbox
        images={sessionImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
};
