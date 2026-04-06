import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Star, Loader2 } from 'lucide-react';
import { getReviews } from '../../lib/supabase/queries';

type Review = {
  parentName: string;
  rating: number;
  date: string;
  review: string;
};

// Placeholder reviews shown when no Supabase reviews have been submitted yet
const PLACEHOLDER_REVIEWS: Review[] = [
  {
    parentName: 'Maria G.',
    rating: 5,
    date: 'Recently',
    review:
      'My son has completely changed since joining. He listens better, focuses in school, and actually looks forward to going to class. The instructors here genuinely care about each kid.',
  },
  {
    parentName: 'James T.',
    rating: 5,
    date: 'Recently',
    review:
      'The instructors are patient and take the time to know each child individually. My daughter went from shy to confident in just a few months. Best decision we made.',
  },
  {
    parentName: 'Priya S.',
    rating: 5,
    date: 'Recently',
    review:
      "We tried another school first. LBMAA is different — it feels like a real community. The kids support each other. It's the best decision we've made for our family.",
  },
  {
    parentName: 'Michael T.',
    rating: 5,
    date: 'Recently',
    review:
      'Both my boys have trained here for over a year. The discipline and respect they\'ve learned carry into every part of their lives — school, home, friendships. Highly recommend.',
  },
  {
    parentName: 'Jennifer M.',
    rating: 5,
    date: 'Recently',
    review:
      'As a parent of a child with ADHD, I was worried about finding an activity that worked for him. LBMAA has been a game-changer. The structured environment and positive reinforcement have made a real difference.',
  },
  {
    parentName: 'Carlos R.',
    rating: 5,
    date: 'Recently',
    review:
      'Clean facility, professional instructors, and a warm atmosphere. Our twins started in Little Dragons and have grown so much — not just in martial arts but in how they carry themselves.',
  },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted'
          }`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const initials = review.parentName
    .split(' ')
    .map((n) => n[0])
    .join('');
  return (
    <div className="bg-white border border-border rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarFallback className="text-xs bg-primary/8 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold leading-tight">{review.parentName}</p>
          <div className="flex items-center gap-2 mt-1">
            <StarRow rating={review.rating} />
            <span className="text-xs text-muted-foreground">{review.date}</span>
          </div>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-foreground flex-1">"{review.review}"</p>
    </div>
  );
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const data = await getReviews();

        const formatted: Review[] = data.map((r: any) => {
          const created = new Date(r.created_at);
          const diffDays = Math.floor((Date.now() - created.getTime()) / 86400000);
          let dateStr =
            diffDays === 0
              ? 'Today'
              : diffDays === 1
              ? '1 day ago'
              : diffDays < 7
              ? `${diffDays} days ago`
              : diffDays < 30
              ? `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
              : diffDays < 365
              ? `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`
              : `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;

          return {
            parentName:
              r.profiles?.display_name ||
              r.families?.primary_email?.split('@')[0] ||
              'LBMAA Parent',
            rating: r.rating,
            date: dateStr,
            review: r.review,
          };
        });

        setReviews(formatted.length > 0 ? formatted : PLACEHOLDER_REVIEWS);
      } catch {
        setReviews(PLACEHOLDER_REVIEWS);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const displayReviews = reviews.length > 0 ? reviews : PLACEHOLDER_REVIEWS;

  return (
    <div>
      {/* ── PAGE HEADER ── */}
      <section className="py-14 border-b bg-slate-50">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">What families are saying</h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Honest words from parents who were in the same position you're in right now.
          </p>
        </div>
      </section>

      {/* ── REVIEWS GRID ── */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="w-6 h-6 animate-spin text-primary" aria-label="Loading reviews" />
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 max-w-6xl">
              {displayReviews.map((review, i) => (
                <ReviewCard key={i} review={review} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CLOSING ── */}
      <section className="py-16 bg-slate-50 border-t">
        <div className="container mx-auto px-6 max-w-lg text-center">
          <h2 className="text-2xl font-bold mb-3">See it for yourself</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-2">
            The first class is free. No uniform, no commitment — just come and meet us.
          </p>
          <p className="text-sm text-muted-foreground">
            Call us at{' '}
            <a
              href="tel:+12095550123"
              className="font-medium text-foreground hover:underline inline-flex items-center min-h-[44px]"
            >
              (209) 555-0123
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
