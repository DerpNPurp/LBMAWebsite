import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Textarea } from '../../../ui/textarea';
import { Label } from '../../../ui/label';
import { Star, Edit2, Check } from 'lucide-react';
import { getUserReview, getFamilyByOwner } from '../../../../lib/supabase/queries';
import { createReview, updateReview } from '../../../../lib/supabase/mutations';
import type { User as AppUser, Review } from '../../../../lib/types';
import { V2PageHeader } from '../shared/V2PageHeader';

function StarPicker({
  rating,
  hovered,
  onHover,
  onLeave,
  onClick,
  readOnly,
}: {
  rating: number;
  hovered: number;
  onHover: (n: number) => void;
  onLeave: () => void;
  onClick: (n: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && onHover(n)}
          onMouseLeave={() => !readOnly && onLeave()}
          onClick={() => !readOnly && onClick(n)}
          className={['transition-transform', !readOnly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'].join(' ')}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            className="w-8 h-8"
            fill={(hovered || rating) >= n ? '#F59E0B' : 'none'}
            stroke={(hovered || rating) >= n ? '#F59E0B' : '#D1D5DB'}
          />
        </button>
      ))}
    </div>
  );
}

export function V2ReviewTab({ user }: { user: NonNullable<AppUser> }) {
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [hovered, setHovered] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const data = await getUserReview(user.id);
        setExistingReview(data);
        if (data) { setRating(data.rating); setReviewText(data.review); }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load review');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.id]);

  const handleSave = async () => {
    if (!reviewText.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (existingReview) {
        const updated = await updateReview(existingReview.review_id, { rating, review: reviewText.trim() });
        setExistingReview(updated);
      } else {
        const family = await getFamilyByOwner(user.id);
        if (!family) throw new Error('Family profile not found. Please complete your profile first.');
        const created = await createReview({ family_id: family.family_id, author_user_id: user.id, rating, review: reviewText.trim() });
        setExistingReview(created);
      }
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const showForm = !existingReview || isEditing;

  return (
    <div className="space-y-6 max-w-2xl">
      <V2PageHeader
        title="Share Your Experience"
        description="Your review helps prospective families learn about LBMAA."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{existingReview && !isEditing ? 'Your Review' : 'Write a Review'}</CardTitle>
              <CardDescription className="mt-1">
                {existingReview && !isEditing
                  ? 'Published on the public website'
                  : 'Share your family\'s experience at LBMAA'}
              </CardDescription>
            </div>
            {existingReview && !isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : showForm ? (
            <>
              <div>
                <Label className="text-base font-medium mb-2 block">Your Rating</Label>
                <StarPicker
                  rating={rating}
                  hovered={hovered}
                  onHover={setHovered}
                  onLeave={() => setHovered(0)}
                  onClick={setRating}
                />
              </div>
              <div>
                <Label htmlFor="review-text" className="text-base font-medium mb-2 block">
                  Your Experience
                </Label>
                <Textarea
                  id="review-text"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share what you love about LBMAA — the instructors, classes, community, your child's progress..."
                  className="text-base resize-none"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">{reviewText.length} characters</p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-3">
                {isEditing && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setIsEditing(false); setRating(existingReview?.rating ?? 5); setReviewText(existingReview?.review ?? ''); }}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  className="flex-1 h-11"
                  disabled={!reviewText.trim() || saving}
                  onClick={handleSave}
                >
                  {saving ? 'Saving...' : isEditing ? 'Update Review' : 'Submit Review'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your review will be published using your name "{user.displayName}" and will appear publicly on the LBMAA website.
              </p>
            </>
          ) : (
            <>
              <StarPicker rating={existingReview.rating} hovered={0} onHover={() => {}} onLeave={() => {}} onClick={() => {}} readOnly />
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-foreground/90 leading-relaxed">{existingReview.review}</p>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-600" />
                Published · {formatDate(existingReview.updated_at || existingReview.created_at)}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
            <li>Be honest and share your genuine experience</li>
            <li>Mention specific classes, instructors, or milestones</li>
            <li>Keep it respectful and constructive</li>
            <li>Focus on what would help other families make a decision</li>
            <li>You can edit your review at any time</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
