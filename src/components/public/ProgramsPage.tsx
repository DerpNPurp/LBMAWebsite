import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { CheckCircle2 } from 'lucide-react';
import { BASE, V3 } from './design';

const PROGRAMS = [
  {
    name: 'Little Dragons',
    ages: 'Ages 4–7',
    summary: 'Fun, structured classes that build listening, coordination, early discipline, and fitness. Our youngest students learn in an age-appropriate environment where confidence and character are built alongside martial arts fundamentals.',
    highlights: [
      'Structured classes designed for young learners',
      'Builds listening skills, coordination, and early discipline',
      'Age-appropriate curriculum in a safe, fun environment',
      'Develops physical fitness and motor skills',
      'Small class sizes for individual attention',
    ],
    photo: '/photos/16-IMG_5107.jpg',
    photoAlt: 'Little Dragons class at LBMAA',
    photoRight: false,
  },
  {
    name: 'Youth Program',
    ages: 'Ages 8–17',
    summary: 'Dynamic, goal-oriented classes that build self-defense, discipline, fitness, coordination, confidence, and a strong mind and body. Students follow a clear belt progression with a curriculum that grows with them through the junior and teen years.',
    highlights: [
      'Goal-oriented training in self-defense and martial arts',
      'Builds discipline, fitness, and coordination',
      'Develops confidence and a strong mind and body',
      'Clear belt progression with defined skill standards',
      'Separate class tracks for juniors and teens',
    ],
    photo: '/photos/1-_MG_5182.jpg',
    photoAlt: 'Youth martial arts class at LBMAA',
    photoRight: true,
  },
  {
    name: 'Extreme Performance',
    ages: 'All Ages',
    summary: 'Invite-only advanced training for handpicked students in gymnastics, weapons, creative forms, and individual and team performance. Selected students train at a higher intensity and compete at regional and national events.',
    highlights: [
      'Invite-only — students are selected by instructors',
      'Advanced gymnastics and acrobatics training',
      'Weapons and creative forms curriculum',
      'Individual and team performance preparation',
      'Competitive team opportunities at regional and national events',
    ],
    photo: '/photos/29-IMG_5072.jpg',
    photoAlt: 'Extreme Performance team at LBMAA',
    photoRight: false,
  },
];

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

const BELT_RANKS = [
  { belt: 'White',      color: '#f9f8f5', border: '#c9c4bc' },
  { belt: 'Yellow',     color: '#fef08a', border: '#ca8a04' },
  { belt: 'Orange',     color: '#fed7aa', border: '#ea580c' },
  { belt: 'Green',      color: '#bbf7d0', border: '#16a34a' },
  { belt: 'Blue',       color: '#bfdbfe', border: '#2563eb' },
  { belt: 'Purple',     color: '#e9d5ff', border: '#9333ea' },
  { belt: 'Red',        color: '#fecaca', border: '#dc2626' },
  { belt: 'Red/Black',  color: '#fecaca', border: '#1f2937' },
  { belt: 'Brown',      color: '#d6b899', border: '#92400e' },
  { belt: 'Brown/Black', color: '#d6b899', border: '#1f2937' },
  { belt: 'Black Belt', color: '#1f2937', border: '#1f2937' },
  { belt: 'Dan Ranks',  color: '#1f2937', border: '#A01F23' },
];

export function ProgramsPage() {
  const navigate = useNavigate();
  const goToTrial = () => navigate(`${BASE}/contact`);

  return (
    <div>

      {/* ── PAGE HERO ── */}
      <section
        className="py-14"
        style={{ backgroundColor: 'white', borderBottom: `1px solid ${V3.border}` }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <p className="v3-eyebrow mb-4">Our Programs</p>
          <h1
            className="v3-h font-black leading-[1.0] mb-6"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: V3.text }}
          >
            Training for Every Stage of Life
          </h1>
          <p className="text-base leading-relaxed max-w-xl" style={{ color: V3.muted }}>
            From our youngest Little Dragons to advanced Extreme Performance competitors — every
            program is built around what students at that stage actually need.
          </p>
        </div>
      </section>

      {/* ── PROGRAM DETAILS ── */}
      {PROGRAMS.map((p, idx) => (
        <section
          key={p.name}
          className="py-20"
          style={{
            backgroundColor: idx % 2 === 0 ? 'white' : V3.surface,
            borderBottom: `1px solid ${V3.border}`,
          }}
        >
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <div
              className={`grid md:grid-cols-2 gap-14 items-center max-w-5xl mx-auto ${
                p.photoRight ? '' : 'md:[&>*:first-child]:order-last'
              }`}
            >
              {/* Photo */}
              <div className="rounded-xl overflow-hidden aspect-[4/3] bg-gray-100">
                <ImageWithFallback
                  src={p.photo}
                  alt={p.photoAlt}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div>
                <span
                  className="inline-block text-[0.65rem] font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-5"
                  style={{ backgroundColor: V3.primaryBg, color: V3.primary }}
                >
                  {p.ages}
                </span>
                <h2
                  className="v3-h font-black leading-[1.0] mb-4"
                  style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', color: V3.text }}
                >
                  {p.name}
                </h2>
                <p className="text-[0.95rem] leading-relaxed mb-7" style={{ color: V3.muted }}>
                  {p.summary}
                </p>
                <ul className="flex flex-col gap-3 mb-8">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-3">
                      <CheckCircle2
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        style={{ color: V3.primary }}
                      />
                      <span className="text-sm leading-relaxed" style={{ color: V3.muted }}>
                        {h}
                      </span>
                    </li>
                  ))}
                </ul>
                <button className="v3-btn-primary" onClick={goToTrial}>
                  Book a Free Trial
                </button>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* ── COMING SOON ── */}
      <section className="py-16" style={{ backgroundColor: 'oklch(16% 0.014 30)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
            <p className="v3-eyebrow mb-3" style={{ color: 'oklch(60% 0.007 30)' }}>Coming Soon</p>
            <h2
              className="v3-h font-black mb-8"
              style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', color: 'oklch(72% 0.005 30)', lineHeight: 1.0 }}
            >
              More Programs on the Way
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
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
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', lineHeight: 1.55, color: 'oklch(46% 0.007 30)' }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BELT SYSTEM ── */}
      <section className="py-16" style={{ backgroundColor: V3.surface }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="max-w-4xl">
            <p className="v3-eyebrow mb-4">Belt System</p>
            <h2
              className="v3-h font-black leading-[1.0] mb-4"
              style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', color: V3.text }}
            >
              Your Path to Black Belt
            </h2>
            <p className="text-sm leading-relaxed mb-8 max-w-lg" style={{ color: V3.muted }}>
              Every promotion is earned — based on demonstrated skill, effort, and character.
              Students test when their instructor says they're ready, not on a fixed schedule.
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {BELT_RANKS.map(({ belt, color, border }) => (
                <div
                  key={belt}
                  className="rounded-lg p-3 text-center"
                  style={{
                    backgroundColor: 'white',
                    border: `1px solid ${V3.border}`,
                  }}
                >
                  <div
                    className="w-8 h-2 rounded-full mx-auto mb-2.5"
                    style={{ backgroundColor: color, border: `2px solid ${border}` }}
                  />
                  <p className="text-xs font-semibold leading-tight" style={{ color: V3.muted }}>
                    {belt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
