import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Sparkles, Users, Zap, Clock } from 'lucide-react';

type ProgramsPageProps = {
  onRequestEnrollment?: () => void;
};

const PROGRAMS = [
  {
    id: 'little-dragons',
    icon: Sparkles,
    name: 'Little Dragons',
    ages: 'Ages 4–6',
    tagline: 'A fun, movement-based start to martial arts.',
    description:
      'Young children learn best through movement and play. Little Dragons classes are structured around games and activities that build listening, coordination, and basic discipline — without feeling like a drill. 30-minute sessions keep young attention spans engaged.',
    classLength: '30 min',
    highlights: [
      'Games and activities, not just drills',
      'Small class sizes for individual attention',
      'Focus on listening and following direction',
      'Positive reinforcement throughout',
    ],
    image: {
      src: 'https://images.unsplash.com/photo-1635962005741-a9c4904d110b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      alt: 'Young children in a martial arts class',
    },
  },
  {
    id: 'junior-warriors',
    icon: Users,
    name: 'Junior Warriors',
    ages: 'Ages 7–12',
    tagline: 'Real skills, real structure, real progress.',
    description:
      'This is where students develop genuine martial arts ability alongside the character traits that define it — discipline, respect, and perseverance. The curriculum is structured with clear belt milestones so students and parents can see real progress. 45-minute sessions.',
    classLength: '45 min',
    highlights: [
      'Structured curriculum with belt progression',
      'Teamwork and peer accountability built in',
      'Regular skill testing with clear standards',
      'Emphasis on focus and self-control',
    ],
    image: {
      src: 'https://images.unsplash.com/photo-1769095211505-fbcbf6530f02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      alt: 'Junior students training in martial arts',
    },
  },
  {
    id: 'teen-program',
    icon: Zap,
    name: 'Teen Program',
    ages: 'Ages 13–16',
    tagline: 'Advanced training and real leadership.',
    description:
      'Teens get a higher-intensity program that challenges them physically and mentally. They also take on mentoring roles with younger students — building the kind of leadership and responsibility that stands out. 60-minute sessions.',
    classLength: '60 min',
    highlights: [
      'Advanced technique refinement',
      'Mentorship role with younger students',
      'Path toward black belt',
      'Fitness conditioning included',
    ],
    image: {
      src: 'https://images.unsplash.com/photo-1720495369604-289694ddabb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      alt: 'Teen students in martial arts training',
    },
  },
];

export function ProgramsPage({ onRequestEnrollment }: ProgramsPageProps) {
  return (
    <div>

      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <section className="py-20 border-b bg-slate-50">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-snug">Our Programs</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Three age-appropriate programs, each built around what children at that stage
            actually need. Not just martial arts — real development.
          </p>
        </div>
      </section>

      {/* ── PROGRAM LIST ────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="space-y-20">
            {PROGRAMS.map((program, index) => {
              const Icon = program.icon;
              const imageRight = index % 2 === 1;

              return (
                <div
                  key={program.id}
                  className={`grid md:grid-cols-2 gap-12 items-center ${
                    imageRight ? '' : 'md:[&>*:first-child]:order-last'
                  }`}
                >
                  {/* Image */}
                  <div className="rounded-xl overflow-hidden aspect-[4/3] bg-muted">
                    <ImageWithFallback
                      src={program.image.src}
                      alt={program.image.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    {/* Age badge */}
                    <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/8 px-3 py-1 rounded-full mb-4">
                      {program.ages}
                    </span>

                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold">{program.name}</h2>
                    </div>

                    <p className="text-base text-muted-foreground font-semibold mb-4">
                      {program.tagline}
                    </p>

                    <p className="text-base text-muted-foreground leading-relaxed mb-6">
                      {program.description}
                    </p>

                    <ul className="space-y-2.5 mb-6">
                      {program.highlights.map((point) => (
                        <li key={point} className="flex items-start gap-2.5 text-sm">
                          <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Class length note */}
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {program.classLength} per class
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ─────────────────────────────────── */}
      <section className="py-20 bg-slate-50 border-t">
        <div className="container mx-auto px-6 text-center max-w-lg">
          <div className="w-8 h-0.5 bg-primary rounded-full mx-auto mb-8" />
          <h2 className="text-2xl font-bold mb-3">Not sure which program fits?</h2>
          <p className="text-muted-foreground text-base mb-8 leading-relaxed">
            Bring your child in for a free trial class and we'll help you figure it out together.
            No commitment, no uniform, no pressure.
          </p>
          <Button size="lg" className="px-10 font-semibold" onClick={onRequestEnrollment}>
            Book a Free Trial Class
          </Button>
          <p className="text-sm text-muted-foreground mt-5">
            Or call us:{' '}
            <a href="tel:+12095550123" className="font-medium text-foreground hover:underline">
              (209) 555-0123
            </a>
          </p>
        </div>
      </section>

    </div>
  );
}
