import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const faqs = [
  {
    question: 'What photography services do you offer?',
    answer:
      'I provide three main photography services: Wedding Photography - I capture your special day with a blend of candid moments and posed portraits, documenting everything from getting ready to the first dance. Portrait and Headshot Photography - Professional headshots for business, LinkedIn, or acting portfolios, plus personal portraits for family occasions. Sessions can be in-studio or on location, and I can bring studio equipment to your chosen spot. Product and Promotional Photography - Commercial photography for businesses including product shots, e-commerce imagery, social media content, and promotional campaigns that help your brand stand out.',
  },
  {
    question: 'What is included in your photography services and what are your rates?',
    answer:
      'Every service is tailored to your specific needs and includes professional consultation, the photography session, and expert post-processing with delivery of high-resolution edited images. For detailed package information and current rates, please visit my [rates section] or [contact me here] for a personalized quote based on your requirements.',
  },
  {
    question:
      'How far in advance should I book my photography session and what is your booking process?',
    answer:
      'I recommend booking as soon as possible since dates fill quickly and I keep a limited number of spots to ensure quality service. For details about each service, please visit my [individual services page]. To secure your date, reach out through my [contact form] and we will discuss your needs, check availability, and finalize your booking with a signed contract and retainer.',
  },
  {
    question: 'When should I book and how does your scheduling work?',
    answer:
      'Honestly, the sooner the better. My calendar fills up fast and I only take on a certain number of clients each month so I can give everyone my full attention. You can see what each service involves on my [individual services page], but the booking process is straightforward - just drop me a line, we will chat about what you need, I will check my availability, and then we will get everything locked in with a contract and deposit. Do not wait too long though - the best dates go quickly.',
  },
  {
    question: 'Do you offer complimentary consultations?',
    answer:
      'Yes. I offer free consultations to discuss your vision, answer questions, and make sure we are the perfect fit. [Schedule your consultation here] - spots are limited each week.',
  },
  {
    question: 'What happens if I wait to book?',
    answer:
      'My calendar fills months in advance, especially for popular wedding dates and seasons. The longer you wait, the less likely your preferred date will be available. I recommend reaching out even if you are just considering it - I can hold your date with a small deposit while you finalize details.',
  },
  {
    question: 'Can you show me recent work from sessions like mine?',
    answer:
      'Absolutely. I love sharing recent galleries that match what you are looking for. [Contact me here] with details about your event or session, and I will send you a personalized portfolio of similar work. This also lets us discuss your specific needs and availability.',
  },
  {
    question: 'What makes you different from other photographers?',
    answer:
      'Great question. Rather than list everything here, I would love to chat personally about your vision and show you exactly how I approach each unique situation. [Let us schedule a quick call] - I think you will immediately feel the difference in how I work with my clients.',
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
              <button
                type="button"
                className="group flex w-full items-center justify-between px-2 py-6 text-left transition-colors hover:bg-gray-50"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <h3 className="pr-8 font-sans text-xs uppercase leading-relaxed tracking-widest text-gray-800 md:text-sm">
                  {faq.question}
                </h3>
                <span className="shrink-0 text-gray-400 transition-colors group-hover:text-gold">
                  {openIndex === index ? <Minus size={14} /> : <Plus size={14} />}
                </span>
              </button>

              <AnimatePresence initial={false}>
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
