import { ImageWithFallback } from '../figma/ImageWithFallback';
import { V3 } from './design';

const STORM_WARM_TONES = [
  'oklch(82% 0.030 32)',
  'oklch(78% 0.026 40)',
  'oklch(75% 0.024 28)',
  'oklch(80% 0.022 44)',
  'oklch(77% 0.028 36)',
  'oklch(73% 0.032 30)',
  'oklch(81% 0.020 42)',
];

const STORM_STUDENTS: { name: string; rank: string; photo?: string }[] = [
  { name: 'Alex M.',    rank: 'Green Belt'  },
  { name: 'Sofia R.',   rank: 'Blue Belt'   },
  { name: 'Marcus T.',  rank: 'Red Belt'    },
  { name: 'Lily C.',    rank: 'Purple Belt' },
  { name: 'Jordan K.',  rank: 'Brown Belt'  },
];

const STATS = [
  { num: '25+',    label: 'Years Training',     sub: 'Started at age 9'                  },
  { num: '5th',    label: 'Degree Black Belt',  sub: 'WCWMA system'                      },
  { num: '1st',    label: 'Degree Black Belt',  sub: 'Marine Corps Martial Arts'         },
  { num: '2020',   label: 'Est.',               sub: 'LBMAA founded'                     },
];


export function InstructorsPage() {
  return (
    <div>

      {/* ── HERO ── */}
      <section style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-center py-9 md:py-12">

            {/* Text */}
            <div className="order-last md:order-first">
              <p className="v3-eyebrow mb-3">Master Instructor</p>
              <h1
                className="v3-h font-black leading-[0.88]"
                style={{
                  fontSize: 'clamp(3.5rem, 9vw, 6rem)',
                  color: V3.text,
                  letterSpacing: '-0.02em',
                }}
              >
                Kwan Jang Nim<br />Eduardo Guerra
              </h1>
            </div>

            {/* Portrait */}
            <div className="order-first md:order-last flex justify-center md:justify-end">
              <div
                style={{
                  width: 'clamp(200px, 32vw, 340px)',
                  aspectRatio: '3 / 4',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  boxShadow: '0 12px 48px oklch(20% 0.015 30 / 0.14)',
                }}
              >
                <ImageWithFallback
                  src="/photos/kjn-guerra-portrait.jpg"
                  alt="KJN Guerra, head instructor at Los Banos Martial Arts Academy"
                  fetchPriority="high"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top center',
                  }}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section style={{ backgroundColor: V3.primary }}>
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 md:gap-x-10 md:gap-y-0 py-5 md:py-6">
            {STATS.map(({ num, label, sub }) => (
              <div key={num + label}>
                <div className="flex items-baseline gap-1.5 mb-0.5" style={{ flexWrap: 'nowrap' }}>
                  <span
                    className="font-black leading-none"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 'clamp(1.25rem, 3.5vw, 2rem)',
                      color: 'white',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {num}
                  </span>
                  <span
                    className="font-bold"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '0.72rem',
                      color: 'white',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </span>
                </div>
                <p
                  className="text-xs leading-snug"
                  style={{ color: 'oklch(82% 0.025 20)', fontStyle: 'italic' }}
                >
                  {sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO I AM ── */}
      <section className="py-12" style={{ backgroundColor: V3.surface }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">

            <div
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                aspectRatio: '4 / 3',
                boxShadow: '0 4px 28px oklch(20% 0.01 30 / 0.1)',
                flexShrink: 0,
              }}
            >
              <ImageWithFallback
                src="/photos/kjn-guerra-with-students.jpg"
                alt="KJN Guerra with students at a tournament"
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div>
              <h2
                className="v3-h font-black leading-[1.0] mb-5"
                style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', color: V3.text }}
              >
                About Me
              </h2>
              <div
                className="flex flex-col gap-4 text-[0.95rem] leading-relaxed"
                style={{ color: V3.muted }}
              >
                <p>
                  I didn't plan on five black belts. I just kept finding things worth
                  learning. That's part of why I teach the way I do. I can pull from
                  different systems to find what actually clicks for each student, not
                  just what works in general.
                </p>
                <p>
                  What ten years in the Marines gave me as an instructor wasn't toughness
                  to hand down. It was patience. Knowing how to hold a real expectation
                  and still make someone feel like they can meet it.
                </p>
                <p>
                  That photo is from a tournament. Those are my students. They've trained
                  hard, they're nervous, and look at their faces. That's what I'm here for.
                  Every single class.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

{/* ── QUOTE ── */}
      <section className="py-12" style={{ backgroundColor: V3.primary }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p
            className="text-xs font-bold uppercase tracking-[0.2em] mb-6"
            style={{ color: 'oklch(85% 0.055 20)', fontFamily: "'Nunito', sans-serif" }}
          >
            Why I do this
          </p>
          <blockquote
            className="v3-h font-black leading-[1.1]"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', color: 'white' }}
          >
            "I'm not building fighters. I'm building kids who walk
            a little taller on the way to school."
          </blockquote>
          <p
            className="mt-6 text-sm"
            style={{ color: 'oklch(85% 0.04 20)', fontStyle: 'italic' }}
          >
            KJN Guerra
          </p>
        </div>
      </section>

      {/* ── STORM ── */}
      <section style={{ backgroundColor: 'white', padding: '5rem 0 6rem' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">

          {/* Heading */}
          <div style={{ marginBottom: '3.5rem' }}>
            <h2
              className="v3-h font-black"
              style={{
                fontSize: 'clamp(5.5rem, 13vw, 10rem)',
                color: V3.text,
                lineHeight: 0.85,
                letterSpacing: '-0.03em',
                marginBottom: '1.25rem',
              }}
            >
              STORM
            </h2>
            <div style={{ height: '2px', backgroundColor: V3.primary, marginBottom: '1.25rem' }} />
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem 3rem',
              }}
            >
              <p
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase' as const,
                  color: V3.primary,
                }}
              >
                Super Team of Role Models
              </p>
              <p
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '0.9rem',
                  lineHeight: 1.75,
                  color: V3.muted,
                  maxWidth: '50ch',
                  textAlign: 'right' as const,
                }}
              >
                These students go above and beyond every single day — passing our values and
                traditions to the next generation of martial artists.
              </p>
            </div>
          </div>

          {/* Student grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {STORM_STUDENTS.map((student, i) => (
              <div
                key={student.name + i}
                style={{
                  backgroundColor: V3.surface,
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'relative', aspectRatio: '1' }}>
                  {student.photo ? (
                    <ImageWithFallback
                      src={student.photo}
                      alt={student.name}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'top center',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: STORM_WARM_TONES[i % STORM_WARM_TONES.length],
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <svg width="62%" height="72%" viewBox="0 0 40 46" fill="none">
                        <ellipse cx="20" cy="11" rx="9.5" ry="10" fill="oklch(52% 0.016 30 / 0.55)" />
                        <path d="M0 44 C0 26 40 26 40 44" fill="oklch(52% 0.016 30 / 0.48)" />
                      </svg>
                    </div>
                  )}
                </div>
                <div style={{ padding: '0.9rem 1rem 1rem' }}>
                  <p
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: '1.08rem',
                      color: V3.text,
                      lineHeight: 1.1,
                      marginBottom: '0.25rem',
                    }}
                  >
                    {student.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: '0.72rem',
                      fontStyle: 'italic',
                      color: V3.muted,
                    }}
                  >
                    {student.rank}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}
