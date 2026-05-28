import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { BASE, V3 } from './design';

const PROGRAMS = [
  {
    name: 'Little Dragons',
    ages: 'Ages 4–6',
    image: '/photos/16-IMG_5107.jpg',
    desc: 'Fun, structured classes that build listening, coordination, and early discipline.',
  },
  {
    name: 'Kids Martial Arts',
    ages: 'Ages 7–12',
    image: '/photos/1-_MG_5182.jpg',
    desc: 'Real belt progression earned through skill — not a fixed calendar.',
  },
  {
    name: 'Teens & Adults',
    ages: 'Ages 13+',
    image: '/photos/29-IMG_5072.jpg',
    desc: 'The full WCWMA curriculum — self-defense, striking, grappling, and conditioning.',
  },
];

const VALUES = [
  { label: 'Honor',      desc: 'Doing the right thing, even when no one is watching.' },
  { label: 'Loyalty',    desc: 'Staying committed to your training, your goals, and the people around you.' },
  { label: 'Family',     desc: 'A school where students are welcomed, supported, and known by name.' },
  { label: 'Bravery',    desc: 'The courage to try, make mistakes in front of others, and keep going.' },
  { label: 'Respect',    desc: 'The foundation of everything we do — shown through attitude and effort.' },
  { label: 'Discipline', desc: 'Staying focused when something is hard. The habit that makes everything else possible.' },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: 'max(88svh, 580px)' }}>
        <ImageWithFallback
          src="/photos/33-_MG_5061.jpg"
          alt="Los Banos Martial Arts Academy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(110deg, oklch(11% 0.018 30 / 0.95) 0%, oklch(11% 0.018 30 / 0.78) 48%, oklch(11% 0.018 30 / 0.18) 100%)',
          }}
        />

        <div className="relative h-full flex items-center">
          <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 w-full">
            <div style={{ maxWidth: '580px' }}>

              <div style={{ width: '36px', height: '3px', backgroundColor: V3.primary, marginBottom: '20px' }} />

              <h1
                className="v3-h font-black mb-6"
                style={{
                  fontSize: 'clamp(3.25rem, 7.5vw, 5.75rem)',
                  color: 'oklch(97% 0.004 30)',
                  lineHeight: 0.95,
                  letterSpacing: '-0.02em',
                }}
              >
                Black Belts<br />
                in Martial Arts.<br />
                <span style={{ color: V3.primary }}>Black Belts in Life.</span>
              </h1>

              <p
                className="leading-relaxed mb-8"
                style={{ color: 'oklch(82% 0.007 30)', maxWidth: '42ch', fontSize: '1rem' }}
              >
                Structured martial arts for kids, teens, and adults in Los Banos — building
                discipline, respect, and confidence that carries beyond the mat.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button className="v3-btn-primary" onClick={() => navigate(`${BASE}/contact`)}>
                  Book a Free Trial Class
                </button>
                <button className="v3-btn-ghost" onClick={() => navigate(`${BASE}/programs`)}>
                  Explore Programs
                </button>
              </div>

              <p style={{ color: 'oklch(52% 0.007 30)', fontSize: '0.72rem', fontFamily: "'Nunito', sans-serif" }}>
                No commitment · No uniform needed · First class is free
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div
            className="grid md:grid-cols-2 gap-12 items-center"
            style={{ maxWidth: '1040px', margin: '0 auto' }}
          >
            <div>
              <p className="v3-eyebrow mb-5">About LBMAA</p>
              <h2
                className="v3-h font-black mb-6"
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  color: V3.text,
                  lineHeight: 1.0,
                  letterSpacing: '-0.015em',
                }}
              >
                More Than Kicks<br />and Punches
              </h2>
              <p
                className="leading-relaxed mb-4"
                style={{ color: V3.muted, fontSize: '0.95rem', maxWidth: '50ch' }}
              >
                The physical training matters — your child gets stronger, more coordinated,
                and more capable. But what stays with them is the discipline to show up when
                something is hard, the respect for the people around them, and the confidence
                that comes from earning something real.
              </p>
              <p
                className="leading-relaxed mb-8"
                style={{ color: V3.muted, fontSize: '0.95rem', maxWidth: '50ch' }}
              >
                LBMAA has been part of the Ernie Reyes' West Coast World Martial Arts Association
                for over 40 years — a system built on exactly those values.
              </p>
              <button
                onClick={() => navigate(`${BASE}/about`)}
                className="v3-h font-bold uppercase tracking-wide text-sm"
                style={{ color: V3.primary, letterSpacing: '0.08em' }}
              >
                Our full story →
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-gray-100 order-first md:order-last" style={{ aspectRatio: '4/5' }}>
              <ImageWithFallback
                src="/photos/12-IMG_5132.jpg"
                alt="LBMAA instructor with students"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── PHOTO STRIP ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 0.85fr 1.15fr',
          height: '280px',
          gap: '3px',
          backgroundColor: V3.surface,
        }}
      >
        {[
          { src: '/photos/18-IMG_5097.jpg', alt: 'Students training' },
          { src: '/photos/20-IMG_5092.jpg', alt: 'Martial arts class' },
          { src: '/photos/10-IMG_5137.jpg', alt: 'LBMAA students' },
          { src: '/photos/59-_MG_4959.jpg', alt: 'Training floor' },
        ].map(({ src, alt }) => (
          <div key={src} style={{ overflow: 'hidden', backgroundColor: V3.border }}>
            <ImageWithFallback src={src} alt={alt} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {/* ── PROGRAMS ── */}
      <section style={{ backgroundColor: V3.surface, paddingTop: '64px', paddingBottom: '64px' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div
            className="flex items-end justify-between mb-8"
            style={{ maxWidth: '1040px', margin: '0 auto 32px' }}
          >
            <div>
              <p className="v3-eyebrow mb-3">Our Programs</p>
              <h2
                className="v3-h font-black"
                style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.75rem)', color: V3.text, lineHeight: 1.0 }}
              >
                Training for Every Stage of Life
              </h2>
            </div>
            <button
              onClick={() => navigate(`${BASE}/programs`)}
              className="v3-h font-bold uppercase tracking-wide hidden md:block flex-shrink-0 ml-8 text-sm"
              style={{ color: V3.primary, letterSpacing: '0.08em' }}
            >
              View all →
            </button>
          </div>

          {/* Photo panels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              height: '460px',
              maxWidth: '1040px',
              margin: '0 auto',
            }}
          >
            {PROGRAMS.map((p) => (
              <div key={p.name} className="relative overflow-hidden" style={{ borderRadius: '10px' }}>
                <ImageWithFallback
                  src={p.image}
                  alt={p.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, oklch(10% 0.016 28 / 0.93) 0%, oklch(10% 0.016 28 / 0.45) 45%, transparent 70%)',
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span
                    style={{
                      display: 'inline-block',
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: V3.primary,
                      backgroundColor: 'oklch(97% 0.011 20)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      marginBottom: '8px',
                    }}
                  >
                    {p.ages}
                  </span>
                  <h3
                    className="v3-h font-black mb-2"
                    style={{ fontSize: 'clamp(1.3rem, 2vw, 1.65rem)', color: 'oklch(97% 0.004 30)', lineHeight: 1.05 }}
                  >
                    {p.name}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: '0.8rem',
                      lineHeight: 1.55,
                      color: 'oklch(78% 0.007 30)',
                    }}
                  >
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 md:hidden" style={{ maxWidth: '1040px', margin: '24px auto 0' }}>
            <button
              onClick={() => navigate(`${BASE}/programs`)}
              className="v3-h font-bold uppercase tracking-wide text-sm"
              style={{ color: V3.primary, letterSpacing: '0.08em' }}
            >
              View all programs →
            </button>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
            <p className="v3-eyebrow mb-4">What We Stand For</p>
            <h2
              className="v3-h font-black mb-12"
              style={{
                fontSize: 'clamp(1.9rem, 3.5vw, 2.75rem)',
                color: V3.text,
                lineHeight: 1.0,
                letterSpacing: '-0.015em',
              }}
            >
              Six Values That Shape Everything
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3">
              {VALUES.map(({ label, desc }) => (
                <div
                  key={label}
                  style={{
                    borderTop: `2px solid ${V3.border}`,
                    paddingTop: '24px',
                    paddingBottom: '28px',
                    paddingRight: '32px',
                  }}
                >
                  <h3
                    className="v3-h font-black mb-2"
                    style={{
                      fontSize: 'clamp(2rem, 3vw, 2.75rem)',
                      color: V3.text,
                      lineHeight: 1.0,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {label}
                  </h3>
                  <p style={{ fontSize: '0.82rem', lineHeight: 1.65, color: V3.muted, fontFamily: "'Nunito', sans-serif" }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20" style={{ backgroundColor: V3.primary }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div style={{ maxWidth: '44ch' }}>
            <p
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'oklch(84% 0.058 22)',
                marginBottom: '20px',
              }}
            >
              Get Started
            </p>
            <h2
              className="v3-h font-black mb-5"
              style={{
                fontSize: 'clamp(2.25rem, 4.5vw, 3.25rem)',
                color: 'white',
                lineHeight: 1.0,
                letterSpacing: '-0.015em',
              }}
            >
              Your Child's First Class Is Free
            </h2>
            <p
              className="leading-relaxed mb-8"
              style={{ color: 'oklch(88% 0.032 22)', fontSize: '0.95rem' }}
            >
              Come in, meet the instructors, and let your child try a class — no pressure,
              no obligation. We'll answer your questions before class and talk with you
              afterward about which program is the right fit.
            </p>
            <button onClick={() => navigate(`${BASE}/contact`)} className="v3-btn-white">
              Contact Us to Get Started
            </button>
            <p
              style={{
                marginTop: '20px',
                fontSize: '0.72rem',
                color: 'oklch(76% 0.032 22)',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              No commitment · No uniform needed · We'll guide you through it
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
