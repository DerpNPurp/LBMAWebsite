import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE, V3 } from './design';

const FAQS = [
  {
    category: 'Getting Started',
    subtitle: 'Everything you need to walk through the door',
    items: [
      { q: 'Does my child need any experience?', a: "None at all. Every student starts at the beginning. Our instructors are trained to work with students at every level, from the very first day." },
      { q: 'What should my child wear to the trial class?', a: "Just comfortable athletic clothes. No uniform, no equipment, and no gear needed. We provide everything for the first class." },
      { q: 'How does the free trial class work?', a: "You and your child come in, meet the instructors, and your child joins a real class with students at their age and level. You watch from the side. Afterward, we'll answer any questions you may have." },
      { q: 'What age can my child start?', a: "Our youngest program, Little Dragons, starts at age 4. We have programs for all ages. We will make sure we pick the right program for your child." },
    ],
  },
  {
    category: 'Programs & Schedule',
    subtitle: 'What we offer and when classes run',
    items: [
      { q: 'What days and times are classes?', a: "Classes run Monday through Friday from 4:00 PM – 9 PM. We are closed Saturday and Sunday. Specific class times vary by age and belt ranking." },
      { q: 'Do you offer adult classes?', a: "No. Coming soon." },
    ],
  },
  {
    category: 'Enrollment & Commitment',
    subtitle: 'No contracts, no pressure',
    items: [
      { q: 'Are there long-term contracts?', a: "Our goal is to ensure every child becomes a black belt. We want families here because they love it and see the positive change in their child." },
      { q: 'How much does it cost?', a: "Monthly tuition varies by program." },
      { q: 'Do I need to buy a uniform right away?', a: "No. Uniforms are included in the first trial class." },
    ],
  },
  {
    category: 'Belt Progression',
    subtitle: 'How ranks and promotions work',
    items: [
      { q: 'How do belt promotions work?', a: "Students are promoted when their instructor determines they're ready — based on demonstrated skill, effort, and character." },
      { q: 'How long does it take to earn a black belt?', a: "It varies significantly by student. A dedicated student training consistently might earn a black belt in 4–7 years. But the journey is the point — each rank represents real growth." },
      { q: 'Is there pressure to test or advance quickly?', a: "None at all. We never rush promotions. Students advance when they're genuinely ready, which makes every belt meaningful." },
    ],
  },
  {
    category: 'Safety',
    subtitle: 'What we do to keep every student safe',
    items: [
      { q: 'Is martial arts safe for young kids?', a: "Safety is the first thing we teach. All classes are supervised by certified instructors. Students will slowly progress from no-contact to contact sparring." },
      { q: 'Are instructors background-checked?', a: "Yes. All LBMAA instructors are background-checked and certified through the ERWCMAA." },
      { q: 'My child is shy or has anxiety. Is this a good fit?', a: "Many of our students start out shy or anxious — and that's exactly why they benefit so much. Our instructors are patient and encouraging. We've seen remarkable transformations in students who struggled with confidence." },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        border: `1px solid ${V3.border}`,
        overflow: 'hidden',
      }}
    >
      <button
        className="w-full flex items-center justify-between gap-4 text-left"
        style={{ padding: '17px 18px' }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-sm font-bold leading-snug" style={{ color: V3.text }}>
          {q}
        </span>
        <span
          className="flex-shrink-0 flex items-center justify-center rounded-full transition-colors"
          style={{
            width: '28px',
            height: '28px',
            backgroundColor: open ? V3.primary : V3.primaryBg,
            color: open ? 'white' : V3.primary,
            fontFamily: 'monospace',
            fontSize: '1rem',
            fontWeight: 700,
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <p
          style={{
            padding: '0 18px 16px',
            fontSize: '0.875rem',
            lineHeight: 1.75,
            color: V3.muted,
            maxWidth: '65ch',
          }}
        >
          {a}
        </p>
      )}
    </div>
  );
}

export function FAQPage() {
  const navigate = useNavigate();

  return (
    <div>

      {/* ── HERO ── */}
      <section className="py-14" style={{ backgroundColor: 'white', borderBottom: `1px solid ${V3.border}` }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <p className="v3-eyebrow mb-4">Common Questions</p>
          <h1
            className="v3-h font-black mb-6"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: V3.text, lineHeight: 1.0, letterSpacing: '-0.01em' }}
          >
            Everything You Need to Know
          </h1>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: V3.muted, maxWidth: '48ch' }}>
            If you don't find your answer here, please reach out. We're here to help you along the way.
          </p>
        </div>
      </section>

      {/* ── FAQ SECTIONS ── */}
      {FAQS.map(({ category, subtitle, items }, idx) => (
        <section
          key={category}
          style={{ backgroundColor: idx % 2 === 0 ? V3.surface : 'white', padding: '68px 0' }}
        >
          <div className="max-w-3xl mx-auto px-6 md:px-10">

            <div className="flex items-start gap-4 mb-8">
              <div style={{ paddingTop: '4px' }}>
                <h2
                  className="v3-h font-extrabold uppercase"
                  style={{ fontSize: '1.6rem', color: V3.text, lineHeight: 1.05, letterSpacing: '0.01em', marginBottom: '4px' }}
                >
                  {category}
                </h2>
                <p style={{ fontSize: '0.78rem', color: V3.muted, lineHeight: 1.5 }}>{subtitle}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>

          </div>
        </section>
      ))}

      {/* ── CTA ── */}
      <section style={{ backgroundColor: V3.primary, padding: '80px 0' }}>
        <div className="max-w-3xl mx-auto px-6 md:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-10">
          <div>
            <p
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'oklch(84% 0.058 22)',
                marginBottom: '12px',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              We're here to help
            </p>
            <h2
              className="v3-h font-black mb-3"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', color: 'white', lineHeight: 1.0, letterSpacing: '-0.01em' }}
            >
              Still have questions?
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'oklch(88% 0.032 22)', lineHeight: 1.65, maxWidth: '40ch' }}>
              Reach out and we'll get back to you quickly. No pressure, no commitment — just an honest conversation.
            </p>
          </div>
          <button
            className="v3-btn-white flex-shrink-0"
            onClick={() => navigate(`${BASE}/contact`)}
          >
            Contact Us
          </button>
        </div>
      </section>

    </div>
  );
}
