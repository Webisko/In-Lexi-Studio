import React, { useEffect, useMemo, useRef, useState } from 'react';

type FaqItem = {
  question: string;
  answer: string;
};

interface FAQSectionProps {
  items?: FaqItem[] | null;
  eyebrow?: string;
  title?: string;
  className?: string;
  titleClassName?: string;
}

const FALLBACK_FAQS: FaqItem[] = [
  {
    question: 'What photography services do you offer?',
    answer:
      'I provide three main photography services: Wedding Photography, Portrait and Headshot Photography, and Product and Promotional Photography.',
  },
  {
    question: 'What is included in your photography services and what are your rates?',
    answer:
      'Every service is tailored to your specific needs and includes professional consultation, the photography session, and expert post-processing with delivery of high-resolution edited images. For detailed package information and current rates, please visit my rates section or contact me here for a personalized quote based on your requirements.',
  },
  {
    question:
      'How far in advance should I book my photography session and what is your booking process?',
    answer:
      'I recommend booking as soon as possible since dates fill quickly and I keep a limited number of spots to ensure quality service. To secure your date, reach out through my contact form and we will discuss your needs, check availability, and finalize your booking with a signed contract and retainer.',
  },
  {
    question: 'Do you offer complimentary consultations?',
    answer:
      'Yes. I offer free consultations to discuss your vision, answer questions, and make sure we are the perfect fit.',
  },
  {
    question: 'What happens if I wait to book?',
    answer:
      'My calendar fills months in advance, especially for popular wedding dates and seasons. The longer you wait, the less likely your preferred date will be available.',
  },
  {
    question: 'Can you show me recent work from sessions like mine?',
    answer:
      'Absolutely. I love sharing recent galleries that match what you are looking for. Contact me with details about your event or session and I will send you a personalized portfolio of similar work.',
  },
];

export const FAQSection: React.FC<FAQSectionProps> = ({
  items,
  eyebrow = 'Questions & Answers',
  title = 'Frequently Asked Questions',
  className = '',
  titleClassName = 'text-4xl md:text-5xl',
}) => {
  const faqs = useMemo(() => {
    const source = Array.isArray(items) && items.length ? items : FALLBACK_FAQS;
    return source
      .map((item) => ({
        question: String(item?.question || '').trim(),
        answer: String(item?.answer || '').trim(),
      }))
      .filter((item) => item.question && item.answer);
  }, [items]);

  const [openIndex, setOpenIndex] = useState(-1);
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (!faqs.length) return;
    if (openIndex >= faqs.length) setOpenIndex(-1);
  }, [faqs, openIndex]);

  return (
    <section className={`bg-off-white px-6 py-24 md:px-24 ${className}`.trim()}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <p className="mb-4 font-sans text-xs uppercase tracking-[0.3em] text-gray-400">
            {eyebrow}
          </p>
          <h2 className={`font-display text-black ${titleClassName}`}>{title}</h2>
        </div>

        <div className="border-t border-gray-200">
          {faqs.map((faq, index) => {
            const isOpen = index === openIndex;
            // Fix encoding issues: replace Unicode replacement character with £
            const cleanAnswer = faq.answer.replace(/\uFFFD/g, '&pound;').replace(/ï¿½/g, '&pound;');
            return (
              <div
                key={`${faq.question}-${index}`}
                className={['faq-item', isOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
              >
                <button
                  type="button"
                  className="faq-summary"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                  id={`faq-summary-${index}`}
                  onClick={() => setOpenIndex((prev) => (prev === index ? -1 : index))}
                >
                  <h3 className="flex-1 pr-8 text-left font-sans text-sm uppercase leading-relaxed tracking-widest text-gray-800 md:text-base">
                    {faq.question}
                  </h3>
                  <span className="faq-icon faq-icon--plus" aria-hidden="true">
                    +
                  </span>
                  <span className="faq-icon faq-icon--minus" aria-hidden="true">
                    –
                  </span>
                </button>

                <div
                  ref={(el) => {
                    panelRefs.current[index] = el;
                  }}
                  className="faq-panel"
                  id={`faq-panel-${index}`}
                  role="region"
                  aria-labelledby={`faq-summary-${index}`}
                  style={{
                    height: isOpen ? `${panelRefs.current[index]?.scrollHeight || 0}px` : '0px',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="faq-content-inner">
                    <div
                      className="body-copy font-sans leading-relaxed text-gray-500"
                      dangerouslySetInnerHTML={{ __html: cleanAnswer }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
