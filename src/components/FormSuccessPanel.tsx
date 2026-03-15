import React from 'react';

interface FormSuccessPanelProps {
  title?: string;
  message?: string;
  homeLabel?: string;
  className?: string;
}

export const FormSuccessPanel: React.FC<FormSuccessPanelProps> = ({
  title = 'Thank you for filling out the form.',
  message = 'I will get back to you as soon as possible, usually within 48 hours.',
  homeLabel = 'Back to Home',
  className = '',
}) => {
  const homeUrl = import.meta.env.BASE_URL || '/';

  return (
    <div
      className={`bg-[#d4af37]/8 rounded-[2rem] border border-[#d4af37]/30 p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.28)] md:p-10 ${className}`.trim()}
    >
      <p className="font-display text-2xl text-[#f3eacb] md:text-3xl">{title}</p>
      <p className="text-white/72 mx-auto mt-4 max-w-2xl font-sans text-base leading-relaxed md:text-lg">
        {message}
      </p>
      <a href={homeUrl} className="btn-secondary mt-8 inline-flex">
        {homeLabel}
      </a>
    </div>
  );
};
