import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: 'What photography services do you offer?',
    answer:
      'I offer three main photography services: Weddings – Full wedding day coverage capturing candid moments and portraits from ceremony to reception. Portraits & Headshots – Professional headshots for business/LinkedIn and personal portrait sessions, in-studio or on location. Product & Promotional Photography – Commercial photography for businesses including product shots, e-commerce images, and marketing campaigns.',
  },
  {
    question: 'What is included in your photography services and what are your rates?',
    answer:
      'Each service includes consultation, professional editing, and high-resolution image delivery. Rates vary based on the specific package and duration of coverage. Please contact us for a detailed price list.',
  },
  {
    question:
      'How far in advance should I book my photography session and what is your booking process?',
    answer:
      'For weddings, we recommend booking 12-18 months in advance. For portrait sessions, 1-2 months is usually sufficient. Our process involves an initial consultation, signing a contract, and a deposit to secure your date.',
  },
  {
    question: 'Do you offer complimentary consultations?',
    answer:
      "Yes, we believe it's important to connect before the big day. We offer complimentary video or in-person consultations to discuss your vision.",
  },
  {
    question: 'What happens if I wait to book?',
    answer:
      'Dates are filled on a first-come, first-served basis. Waiting may result in your preferred date being unavailable.',
  },
  {
    question: 'Can you show me recent work from sessions like mine?',
    answer:
      "Absolutely. You can view our 'Latest Moments' section or request full gallery examples relevant to your specific event type.",
  },
  {
    question: 'What makes you different from other photographers?',
    answer:
      "Our focus is on raw emotion and storytelling. We don't just take pictures; we preserve the feeling of the moment, creating a legacy for you to cherish.",
  },
];

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-off-white px-6 py-24 md:px-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <p className="mb-4 font-sans text-xs uppercase tracking-[0.3em] text-gray-400">
            Love Stories from Past Clients
          </p>
          <h2 className="font-display text-4xl text-black md:text-5xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="border-t border-gray-200">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200">
              <div
                className="group flex cursor-pointer items-center justify-between px-2 py-6 transition-colors hover:bg-gray-50"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <h3 className="pr-8 font-sans text-xs uppercase leading-relaxed tracking-widest text-gray-800 md:text-sm">
                  {faq.question}
                </h3>
                <span className="shrink-0 text-gray-400 transition-colors group-hover:text-gold">
                  {openIndex === index ? <Minus size={14} /> : <Plus size={14} />}
                </span>
              </div>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 pb-8 pt-2">
                      <p className="font-serif text-lg leading-relaxed text-gray-500">
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
