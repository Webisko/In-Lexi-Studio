import React, { useState } from 'react';
import { FormSuccessPanel } from '../FormSuccessPanel';
import { ServiceCrossLinks } from '../ServiceCrossLinks';
import type { Page } from '../../lib/api';

interface Props {
  page: Page;
}

const API_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_API_URL
    ? import.meta.env.PUBLIC_API_URL
    : '/app/api';

const ComingSoonLanding: React.FC<Props> = ({ page }) => {
  const [formState, setFormState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [fields, setFields] = useState({ name: '', email: '', phone: '', message: '' });
  const hasHeroIntro = Boolean(page.hero_image || page.title);
  const currentSlug =
    page.slug === 'portrait-photography' ? 'portrait-photography' : 'product-photography';
  const formType = currentSlug === 'portrait-photography' ? 'portrait' : 'product';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState('sending');

    try {
      const body = new FormData();
      body.append('formType', formType);
      body.append('name', fields.name);
      body.append('email', fields.email);
      if (fields.phone) body.append('phone', fields.phone);
      body.append('message', fields.message);

      const res = await fetch(`${API_URL}/contact`, { method: 'POST', body });
      if (!res.ok) throw new Error('failed');

      setFormState('success');
      setFields({ name: '', email: '', phone: '', message: '' });
    } catch {
      setFormState('error');
    }
  };

  return (
    <div className="bg-[#080808]">
      <section className="container mx-auto max-w-3xl px-6 pb-16 pt-20 text-center">
        <span className="font-display text-xs uppercase tracking-[0.35em] text-[#c5a059]">
          Currently in preparation
        </span>
        <div className="mx-auto mt-6 h-[1px] w-12 bg-[#c5a059]/50" />
        <p className="mt-8 font-sans text-lg leading-relaxed text-white/60 md:text-xl">
          {hasHeroIntro
            ? `The full ${page.title?.toLowerCase() || 'session'} experience is currently being prepared. If you are interested, please get in touch and I will gladly answer any questions you may have.`
            : 'This page is currently being prepared. If you are interested in a session, please get in touch and I will gladly answer any questions you may have.'}
        </p>
      </section>

      <div className="mx-auto max-w-xs">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#c5a059]/30 to-transparent" />
      </div>

      <section className="container mx-auto max-w-2xl px-6 pb-28 pt-16">
        <div className="mb-10 text-center">
          <span className="font-display text-xs uppercase tracking-[0.35em] text-[#c5a059]">
            Get in Touch
          </span>
          <h3 className="mt-4 font-display text-3xl text-white md:text-4xl">Send a Message</h3>
        </div>

        {formState === 'success' ? (
          <FormSuccessPanel
            title="Thank you for filling out the form."
            message="I will get back to you as soon as possible. You should usually hear from me within 48 hours."
            homeLabel="Back to Home"
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block font-display text-xs uppercase tracking-widest text-[#c5a059]">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={fields.name}
                  onChange={handleChange}
                  className="w-full rounded border border-white/10 bg-black/30 p-4 font-sans text-base text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#c5a059]"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="mb-2 block font-display text-xs uppercase tracking-widest text-[#c5a059]">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={fields.email}
                  onChange={handleChange}
                  className="w-full rounded border border-white/10 bg-black/30 p-4 font-sans text-base text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#c5a059]"
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-display text-xs uppercase tracking-widest text-[#c5a059]">
                Phone Number{' '}
                <span className="normal-case tracking-normal text-white/30">(optional)</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={fields.phone}
                onChange={handleChange}
                className="w-full rounded border border-white/10 bg-black/30 p-4 font-sans text-base text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#c5a059]"
                placeholder="+44 7700 900000"
              />
            </div>

            <div>
              <label className="mb-2 block font-display text-xs uppercase tracking-widest text-[#c5a059]">
                Message *
              </label>
              <textarea
                name="message"
                required
                rows={5}
                value={fields.message}
                onChange={handleChange}
                className="w-full resize-none rounded border border-white/10 bg-black/30 p-4 font-sans text-base text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#c5a059]"
                placeholder="Tell me about your session — when, where, the mood you have in mind…"
              />
            </div>

            {formState === 'error' && (
              <p className="text-center font-sans text-base text-red-400">
                Something went wrong. Please try again or contact me directly by email.
              </p>
            )}

            <button
              type="submit"
              disabled={formState === 'sending'}
              className="btn-secondary w-full"
            >
              {formState === 'sending' ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}
      </section>

      <div className="px-6">
        <ServiceCrossLinks currentSlug={currentSlug} />
      </div>
    </div>
  );
};

export default ComingSoonLanding;
