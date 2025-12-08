import type { ReactNode } from 'react';

type SectionProps = {
  title: string;
  kicker: string;
  children: ReactNode;
};

export function Section({ title, kicker, children }: SectionProps) {
  return (
    <section className="section">
      <div className="section-header">
        <span className="kicker">{kicker}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
