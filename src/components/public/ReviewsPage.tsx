import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useReviews } from '../../lib/hooks/reviews';
import type { Review } from '../../lib/types';
import { V3 } from './design';

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}

function RatingSummary({ reviews }: { reviews: Review[] }) {
  if (reviews.length < 1) return null;

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  return (
    <section className="py-5 md:py-6 px-6 md:px-10" style={{ backgroundColor: V3.primary }}>
      <div className="flex items-center gap-7 flex-wrap justify-center">
        <div className="flex-shrink-0 text-center">
          <div
            className="v3-h font-black text-white leading-none"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}
          >
            {avg.toFixed(1)}
          </div>
          <div className="my-1">
            <StarRow rating={Math.round(avg)} />
          </div>
          <div
            className="text-white uppercase tracking-wide"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.7rem', fontWeight: 700 }}
          >
            Overall Rating
          </div>
          <div className="italic text-xs" style={{ color: 'oklch(82% 0.025 20)' }}>
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </div>
        </div>

        <div className="hidden md:block w-px h-10" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />

        <div className="space-y-1">
          {dist.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2">
              <span
                className="text-white text-right"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.6rem', fontWeight: 700, width: '1.25rem' }}
              >
                {star}★
              </span>
              <div
                className="relative h-1.5 rounded-full overflow-hidden"
                style={{ width: '5rem', backgroundColor: 'rgba(255,255,255,0.18)' }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-amber-400"
                  style={{ width: `${(count / reviews.length) * 100}%` }}
                />
              </div>
              <span style={{ color: 'oklch(82% 0.025 20)', fontSize: '0.6rem', width: '1rem' }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col"
      style={{ backgroundColor: 'white', border: `1px solid ${V3.border}` }}
    >
      <div className="mb-2">
        <StarRow rating={review.rating} />
      </div>
      <p className="flex-1 italic leading-relaxed mb-3" style={{ fontSize: '0.9rem', color: V3.muted }}>
        "{review.review}"
      </p>
      <p className="text-sm font-semibold" style={{ color: V3.text }}>
        {review.display_name || 'LBMAA Parent'}
      </p>
      <p className="text-xs mt-0.5" style={{ color: V3.muted }}>
        {timeAgo(review.created_at)}
      </p>
    </div>
  );
}

export function ReviewsPage() {
  const { data: reviews = [], isLoading: loading, isError } = useReviews();
  const [visibleCount, setVisibleCount] = useState(6);

  const visible = reviews.slice(0, visibleCount);
  const remaining = reviews.length - visibleCount;

  return (
    <div>
      {/* Hero */}
      <section
        className="py-14"
        style={{ backgroundColor: 'white', borderBottom: `1px solid ${V3.border}` }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <p className="v3-eyebrow mb-4">What Families Say</p>
          <h1
            className="v3-h font-black leading-[1.0] mb-6"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: V3.text }}
          >
            From the LBMAA Community
          </h1>
          <p className="text-base leading-relaxed max-w-xl" style={{ color: V3.muted }}>
            Every review below comes from a parent or student who was exactly where you are
            right now — wondering if this is the right place.
          </p>
        </div>
      </section>

      {loading ? (
        <section className="py-32 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: V3.primary }} />
        </section>
      ) : isError ? (
        <section className="py-32 text-center" style={{ color: V3.muted }}>
          <p>Unable to load reviews. Please try again later.</p>
        </section>
      ) : reviews.length === 0 ? (
        <section className="py-32 text-center" style={{ color: V3.muted }}>
          <p className="text-sm">No reviews yet — check back soon.</p>
        </section>
      ) : (
        <>
          <RatingSummary reviews={reviews} />

          {/* Card grid */}
          <section className="py-6 px-6 md:px-10" style={{ backgroundColor: V3.surface }}>
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visible.map(r => (
                  <ReviewCard key={r.review_id} review={r} />
                ))}
              </div>
              {remaining > 0 && (
                <div className="mt-4 text-center">
                  <button
                    className="v3-btn-outline"
                    onClick={() => setVisibleCount(c => c + 6)}
                  >
                    Load more reviews
                  </button>
                  <p className="text-xs mt-2" style={{ color: V3.muted }}>
                    {remaining} more {remaining === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
