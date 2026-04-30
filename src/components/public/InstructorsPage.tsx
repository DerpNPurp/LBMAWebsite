import { ImageWithFallback } from '../figma/ImageWithFallback';
import { V3 } from './design';

const STATS = [
  { num: '30+', label: 'Years Training',  sub: 'Started at 12, never stopped'     },
  { num: '5',   label: 'Black Belts',     sub: 'Across five different arts'        },
  { num: '10',  label: 'Years USMC',      sub: 'Honorably discharged'              },
  { num: '5',   label: 'Years Teaching',  sub: 'At LBMAA since day one'            },
];


export function InstructorsPage() {
  return (
    <div>

      {/* ── HERO ── */}
      <section style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-end py-9 md:py-12">

            {/* Text */}
            <div className="order-last md:order-first">
              <p className="v3-eyebrow mb-3">Head Instructor</p>
              <h1
                className="v3-h font-black leading-[0.88] mb-4"
                style={{
                  fontSize: 'clamp(3.5rem, 9vw, 6rem)',
                  color: V3.text,
                  letterSpacing: '-0.02em',
                }}
              >
                KJN<br />Guerra
              </h1>
              <p
                className="text-base leading-relaxed max-w-md"
                style={{ color: V3.muted }}
              >
                Thirty years of training. Ten years in the Marines. Five years teaching kids
                who've taught me more than I expected.
              </p>
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
              <div key={label}>
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span
                    className="font-black leading-none"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                      color: 'white',
                    }}
                  >
                    {num}
                  </span>
                  <span
                    className="font-bold"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '0.8rem',
                      color: 'white',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
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



    </div>
  );
}
