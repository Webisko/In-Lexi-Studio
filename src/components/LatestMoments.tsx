import React from 'react';
import { motion } from 'framer-motion';

interface Moment {
  id: number;
  title: string;
  image: string;
}

const moments: Moment[] = [
  { id: 1, title: "Claire & Ryan", image: "https://images.unsplash.com/photo-1621621667797-e06afc21085c?q=80&w=1000&auto=format&fit=crop" },
  { id: 2, title: "Alice & Alex", image: "https://images.unsplash.com/photo-1511285560982-1351cdeb9821?q=80&w=1000&auto=format&fit=crop" },
  { id: 3, title: "Clair & John", image: "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=1000&auto=format&fit=crop" },
  { id: 4, title: "Chloe & Thomas", image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1000&auto=format&fit=crop" },
  { id: 5, title: "Lesleyann & Colin", image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1000&auto=format&fit=crop" },
  { id: 6, title: "BillyJo & Martin", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop" },
];

export const LatestMoments: React.FC = () => {
  return (
    <section className="bg-white py-24 md:py-32 px-4 md:px-12">
      <div className="flex flex-col items-center mb-20">
         <h2 className="font-display text-4xl md:text-6xl text-black text-center leading-none">
           LATEST <br/> MOMENTS
         </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {moments.map((moment, index) => (
          <motion.div 
            key={moment.id} 
            className="group relative cursor-pointer"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.8 }}
          >
            <div className="aspect-[3/4] overflow-hidden relative">
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 z-10 flex items-center justify-center">
                   <span className="border border-white text-white px-6 py-2 text-[10px] tracking-widest uppercase opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                       DISCOVER
                   </span>
               </div>
               <img 
                 src={moment.image} 
                 alt={moment.title} 
                 className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
               />
            </div>
            
            <div className="mt-4 text-center">
               <h3 className="font-serif italic text-2xl text-gray-800">{moment.title}</h3>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Decorative End Mark */}
      <div className="flex justify-center mt-24">
          <span className="font-display text-4xl text-gold/50">ILS</span>
      </div>
    </section>
  );
};