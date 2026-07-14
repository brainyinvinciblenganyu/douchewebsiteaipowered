import type { ReactNode } from 'react';

export default function PageHero({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[32px] bg-gradient-to-r from-[#0058a3] to-blue-600 p-10 text-white shadow-2xl shadow-[#0058a3]/25 md:p-12 ${className}`}
    >
      {children}
    </section>
  );
}
