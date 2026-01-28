import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: "What photography services do you offer?",
    answer: "I offer three main photography services: Weddings – Full wedding day coverage capturing candid moments and portraits from ceremony to reception. Portraits & Headshots – Professional headshots for business/LinkedIn and personal portrait sessions, in-studio or on location. Product & Promotional Photography – Commercial photography for businesses including product shots, e-commerce images, and marketing campaigns."
  },
  {
    question: "What is included in your photography services and what are your rates?",
    answer: "Each service includes consultation, professional editing, and high-resolution image delivery. Rates vary based on the specific package and duration of coverage. Please contact us for a detailed price list."
  },
  {
    question: "How far in advance should I book my photography session and what is your booking process?",
    answer: "For weddings, we recommend booking 12-18 months in advance. For portrait sessions, 1-2 months is usually sufficient. Our process involves an initial consultation, signing a contract, and a deposit to secure your date."
  },
  {
    question: "Do you offer complimentary consultations?",
    answer: "Yes, we believe it's important to connect before the big day. We offer complimentary video or in-person consultations to discuss your vision."
  },
  {
    question: "What happens if I wait to book?",
    answer: "Dates are filled on a first-come, first-served basis. Waiting may result in your preferred date being unavailable."
  },
  {
    question: "Can you show me recent work from sessions like mine?",
    answer: "Absolutely. You can view our 'Latest Moments' section or request full gallery examples relevant to your specific event type."
  },
  {
    question: "What makes you different from other photographers?",
    answer: "Our focus is on raw emotion and storytelling. We don't just take pictures; we preserve the feeling of the moment, creating a legacy for you to cherish."
  }
];

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-off-white py-24 px-6 md:px-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-gray-400 mb-4">Love Stories from Past Clients</p>
            <h2 className="font-display text-4xl md:text-5xl text-black">Frequently Asked Questions</h2>
        </div>

        <div className="border-t border-gray-200">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200">
              <div 
                className="py-6 flex justify-between items-center cursor-pointer group hover:bg-gray-50 transition-colors px-2"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <h3 className="font-sans text-gray-800 text-xs md:text-sm tracking-widest uppercase pr-8 leading-relaxed">
                  {faq.question}
                </h3>
                <span className="text-gray-400 group-hover:text-gold transition-colors shrink-0">
                  {openIndex === index ? <Minus size={14} /> : <Plus size={14} />}
                </span>
              </div>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-8 pt-2 px-2">
                      <p className="text-gray-500 font-serif text-lg leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};