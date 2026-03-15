import React from 'react';

type ServiceSlug = 'wedding-photography' | 'portrait-photography' | 'product-photography';

interface ServiceCrossLinksProps {
  currentSlug: ServiceSlug;
}

const serviceConfig: Record<
  ServiceSlug,
  { title: string; eyebrow: string; description: string; cta: string }
> = {
  'wedding-photography': {
    title: 'Wedding Photography',
    eyebrow: 'Love stories',
    description:
      'Documentary and editorial wedding coverage shaped around the emotion of your day.',
    cta: 'Explore Wedding',
  },
  'portrait-photography': {
    title: 'Portrait Photography',
    eyebrow: 'Personal stories',
    description: 'Refined portrait sessions with natural direction, atmosphere and presence.',
    cta: 'Explore Portraits',
  },
  'product-photography': {
    title: 'Product Photography',
    eyebrow: 'Brand presence',
    description:
      'Clean, elevated product imagery built to make your work feel desirable and polished.',
    cta: 'Explore Products',
  },
};

export const ServiceCrossLinks: React.FC<ServiceCrossLinksProps> = ({ currentSlug }) => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const otherServices = (Object.keys(serviceConfig) as ServiceSlug[]).filter(
    (slug) => slug !== currentSlug,
  );

  return (
    <section className="mt-24 pb-24 md:mt-32 md:pb-32">
      <div className="mx-auto max-w-6xl text-center">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#d4af37]">Explore More</p>
        <h2 className="font-display text-3xl text-white md:text-5xl">
          Looking For Something Else?
        </h2>
        <p className="text-white/66 mx-auto mt-5 max-w-3xl text-base leading-relaxed md:text-lg">
          If another kind of session is also on your mind, these two offers are the closest match to
          explore next.
        </p>
        <div className="mx-auto mt-6 h-[1px] w-16 bg-[#d4af37]/50" />
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-2">
        {otherServices.map((slug) => {
          const service = serviceConfig[slug];
          return (
            <article
              key={slug}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#d4af37]/35 hover:bg-[#111111] md:p-10"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.14),transparent_42%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative">
                <p className="text-[#d4af37]/78 text-xs uppercase tracking-[0.28em]">
                  {service.eyebrow}
                </p>
                <h3 className="mt-4 font-display text-2xl text-white md:text-3xl">
                  {service.title}
                </h3>
                <p className="text-white/68 mt-4 max-w-xl text-base leading-relaxed md:text-lg">
                  {service.description}
                </p>
                <a href={`${baseUrl}${slug}`} className="btn-secondary mt-8 inline-flex">
                  {service.cta}
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
