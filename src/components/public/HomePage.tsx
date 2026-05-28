import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { BASE, V3 } from './design';

const COMING_SOON = [
  {
    name: 'Adults',
    ages: 'Ages 18+',
    desc: 'Dynamic, goal-oriented classes that build self-defense, strength, fitness, confidence, and stress relief.',
  },
  {
    name: 'Endurance Fitness Kickboxing',
    ages: 'Ages 16+',
    desc: 'High-energy cardio kickboxing classes focused on building stamina, strength, coordination, and overall fitness.',
  },
];

const PROGRAMS = [
  {
    name: 'Little Dragons',
    ages: 'Ages 4–7',
    image: '/photos/16-IMG_5107.jpg',
    desc: 'Fun, structured classes that build listening, coordination, early discipline, and fitness.',
  },
  {
    name: 'Youth Program',
    ages: 'Ages 8–17',
    image: '/photos/1-_MG_5182.jpg',
    desc: 'Dynamic, goal-oriented classes that build self-defense, discipline, fitness, coordination, confidence, and a strong mind and body.',
  },
  {
    name: 'Extreme Performance',
    ages: 'All Ages',
    image: '/photos/29-IMG_5072.jpg',
    desc: 'Invite-only advanced training for handpicked students in gymnastics, weapons, creative forms, and individual and team performance.',
  },
];

const VALUES = ['Honor', 'Loyalty', 'Family', 'Bravery'];

export function HomePage() {
  const navigate = useNavigate();
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

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
                Healthier active lifestyle through martial arts. <br />Start Your black belt journey today. <br />English and Spanish speaking.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button className="v3-btn-primary" onClick={() => navigate(`${BASE}/contact`)}>
                  Book a Trial Class
                </button>
                <button className="v3-btn-ghost" onClick={() => navigate(`${BASE}/programs`)}>
                  Explore Programs
                </button>
              </div>

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
              <p className="v3-eyebrow mb-5">About</p>
              <h2
                className="v3-h font-black mb-6"
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  color: V3.text,
                  lineHeight: 1.0,
                  letterSpacing: '-0.015em',
                }}
              >
                More Than Kicking<br />and Punching.<br /><span style={{ color: V3.primary }}>It's a Way of Life.</span>
              </h2>
              <p
                className="leading-relaxed mb-4"
                style={{ color: V3.muted, fontSize: '0.95rem', maxWidth: '50ch' }}
              >
                The physical training matters — your child gets stronger, more coordinated,
                and more capable. However, what stays with them is the discipline to show up when
                something becomes challenging, the respect for the people around them, and the
                confidence that comes with earning an Ernie Reyes West Coast World martial arts
                black belt.
              </p>
              <p
                className="leading-relaxed mb-8"
                style={{ color: V3.muted, fontSize: '0.95rem', maxWidth: '50ch' }}
              >
                Our academy has been part of a legacy spanning over 40 years at Ernie Reyes'
                West Coast World Martial Arts Association.
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

          {/* Coming soon strips */}
          <div
            style={{
              maxWidth: '1040px',
              margin: '6px auto 0',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
            }}
          >
            {COMING_SOON.map((p) => (
              <div
                key={p.name}
                style={{
                  borderRadius: '10px',
                  backgroundColor: 'oklch(22% 0.014 30)',
                  padding: '28px 32px',
                }}
              >
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-block', fontFamily: "'Nunito', sans-serif", fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'oklch(74% 0.11 54)', backgroundColor: 'oklch(74% 0.11 54 / 0.14)', padding: '2px 8px', borderRadius: '999px' }}>Coming Soon</span>
                  <span style={{ display: 'inline-block', fontFamily: "'Nunito', sans-serif", fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'oklch(52% 0.007 30)', backgroundColor: 'oklch(29% 0.012 30)', padding: '2px 8px', borderRadius: '999px' }}>{p.ages}</span>
                </div>
                <h3 className="v3-h font-black mb-2" style={{ fontSize: 'clamp(1.1rem, 1.6vw, 1.35rem)', color: 'oklch(72% 0.005 30)', lineHeight: 1.05 }}>{p.name}</h3>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.78rem', lineHeight: 1.55, color: 'oklch(46% 0.007 30)' }}>{p.desc}</p>
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
      <section className="py-14" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
            <p className="v3-eyebrow mb-3">What We Stand For</p>
            <h2
              className="v3-h font-black mb-8"
              style={{
                fontSize: 'clamp(1.9rem, 3.5vw, 2.75rem)',
                color: V3.text,
                lineHeight: 1.0,
                letterSpacing: '-0.015em',
              }}
            >
              Our Martial Arts Values
            </h2>

            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-px"
              style={{ backgroundColor: V3.border }}
            >
              {VALUES.map((label, i) => (
                <div
                  key={label}
                  className="cursor-default relative overflow-hidden"
                  style={{
                    backgroundColor: hoveredValue === i ? 'white' : 'var(--v3-surface)',
                    padding: '20px 20px 28px',
                    transition: 'background-color 0.25s ease',
                  }}
                  onMouseEnter={() => setHoveredValue(i)}
                  onMouseLeave={() => setHoveredValue(null)}
                >
                  {/* Ghost ordinal cropped at bottom-right for depth */}
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      bottom: '-10px',
                      right: '6px',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 900,
                      fontSize: '5.5rem',
                      lineHeight: 1,
                      letterSpacing: '-0.06em',
                      color: V3.text,
                      opacity: 0.055,
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 900,
                      fontSize: '0.6rem',
                      letterSpacing: '0.2em',
                      color: V3.muted,
                      opacity: 0.55,
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    0{i + 1}
                  </span>
                  <span
                    className="v3-h font-black relative"
                    style={{
                      fontSize: 'clamp(1.6rem, 2.8vw, 2.25rem)',
                      color: hoveredValue === i ? V3.primary : V3.text,
                      lineHeight: 1.0,
                      letterSpacing: '-0.02em',
                      display: 'block',
                      transition: 'color 0.25s ease',
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20" style={{ backgroundColor: V3.primary }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div style={{ maxWidth: '44ch', margin: '0 auto', textAlign: 'center' }}>
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
              One Week Trial Offer
            </h2>
            <p
              className="leading-relaxed mb-8"
              style={{ color: 'oklch(88% 0.032 22)', fontSize: '0.95rem' }}
            >
              To try our program is $30 with a uniform included for 5 consecutive training days.
              Come in, meet the instructors, and let your child try a class. We'll answer your
              questions before class and after class.
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
              We'll guide you through it
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
