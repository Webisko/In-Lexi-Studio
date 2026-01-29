import React from 'react';

interface Moment {
  id: number;
  title: string;
  image: string;
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

export const LatestMoments: React.FC = () => {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="grid h-[65vh] min-h-[520px] w-full grid-cols-1 grid-rows-7 md:grid-cols-4 md:grid-rows-2">
        {/* Title cell - merged/spans 2 rows on desktop */}
        <div className="relative flex items-start justify-start bg-gradient-to-br from-black/60 to-black/40 p-10 md:row-span-2 md:p-14">
          <h2 className="text-left font-display text-[clamp(2rem,3.5vw,3.5rem)] leading-[0.95] tracking-wide text-white">
            LATEST
            <br />
            MOMENTS
          </h2>
        </div>

        {/* 6 image tiles */}
        {moments.map((moment, index) => (
          <div key={moment.id} className="group relative cursor-pointer overflow-hidden">
            <div className="absolute inset-0 z-10 bg-black/25 transition-colors duration-500 group-hover:bg-black/10" />

            <img
              src={moment.image}
              alt={moment.title}
              className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />

            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-6">
              <h3 className="text-center font-serif text-[clamp(1.5rem,2.5vw,2.5rem)] italic leading-tight text-white drop-shadow-lg">
                {moment.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
