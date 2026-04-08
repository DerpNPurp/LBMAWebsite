import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Star, Loader2 } from 'lucide-react';
import { getReviews } from '../../lib/supabase/queries';
import type { Review } from '../../lib/types';

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
  const parentName = review.display_name || 'LBMAA Parent';
  const initials = parentName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('');
  const diffDays = Math.floor((Date.now() - new Date(review.created_at).getTime()) / 86400000);
  const dateStr =
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

  return (
    <div className="bg-white border border-border rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarFallback className="text-xs bg-primary/8 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold leading-tight">{parentName}</p>
          <div className="flex items-center gap-2 mt-1">
            <StarRow rating={review.rating} />
            <span className="text-xs text-muted-foreground">{dateStr}</span>
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const data = await getReviews();
        setReviews(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reviews.');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

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
          ) : error ? (
            <div className="text-center py-24 text-muted-foreground">
              <p>Unable to load reviews. Please try again later.</p>
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm py-12">No reviews yet — check back soon.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 max-w-6xl">
              {reviews.map((review) => (
                <ReviewCard key={review.review_id} review={review} />
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
