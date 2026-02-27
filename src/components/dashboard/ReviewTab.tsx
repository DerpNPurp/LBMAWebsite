import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Star, Edit2, Check } from 'lucide-react';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'family';
  displayName: string;
};

type Review = {
  id: string;
  parentName: string;
  rating: number;
  review: string;
  createdAt: string;
  updatedAt?: string;
};

// Mock existing review - null means no review yet
const mockExistingReview: Review | null = null;

export function ReviewTab({ user }: { user: User }) {
  const [existingReview, setExistingReview] = useState<Review | null>(mockExistingReview);
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [reviewText, setReviewText] = useState(existingReview?.review || '');
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSaveReview = () => {
    if (!reviewText.trim()) {
      alert('Please write a review before submitting.');
      return;
    }

    const now = new Date().toISOString();
    const review: Review = {
      id: existingReview?.id || Date.now().toString(),
      parentName: user.displayName,
      rating,
      review: reviewText.trim(),
      createdAt: existingReview?.createdAt || now,
      updatedAt: existingReview ? now : undefined
    };

    setExistingReview(review);
    setIsEditing(false);
    
    // In production, this would save to Supabase and appear on the public ReviewsPage
    alert('Thank you! Your review has been submitted and will appear on the public website.');
  };

  const handleEditReview = () => {
    if (existingReview) {
      setRating(existingReview.rating);
      setReviewText(existingReview.review);
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (existingReview) {
      setRating(existingReview.rating);
      setReviewText(existingReview.review);
    } else {
      setRating(5);
      setReviewText('');
    }
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isAddingNew = !existingReview;
  const showForm = isAddingNew || isEditing;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Share Your Experience</h2>
        <p className="text-muted-foreground mt-1">
          Your review will be published on our public website to help prospective families
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {isAddingNew ? 'Write a Review' : 'Your Review'}
              </CardTitle>
              <CardDescription>
                {isAddingNew 
                  ? 'Share your family\'s experience at LBMAA with prospective families'
                  : 'Published on the public website'
                }
              </CardDescription>
            </div>
            {existingReview && !isEditing && (
              <Button variant="outline" onClick={handleEditReview}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Review
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showForm ? (
            <div className="space-y-6">
              {/* Rating Selector */}
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoveredStar || rating)
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {rating} {rating === 1 ? 'star' : 'stars'}
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div className="space-y-2">
                <Label>Your Review</Label>
                <Textarea
                  placeholder="Share your experience at LBMAA. What has your family's journey been like? How have the instructors and programs impacted your children?"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground">
                  {reviewText.length} characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleSaveReview} disabled={!reviewText.trim()}>
                  <Check className="w-4 h-4 mr-2" />
                  {isAddingNew ? 'Submit Review' : 'Save Changes'}
                </Button>
                {isEditing && (
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>

              {/* Info */}
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Your review will be published using your name "{user.displayName}" 
                  and will appear publicly on the LBMAA website. Reviews help prospective families learn 
                  about our academy and the positive impact we have on students and their families.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Display Existing Review */}
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= existingReview!.rating
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {existingReview!.rating} out of 5 stars
                </span>
              </div>

              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{existingReview!.review}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Published by {existingReview!.parentName}</span>
                <span>
                  {existingReview!.updatedAt 
                    ? `Updated ${formatDate(existingReview!.updatedAt)}`
                    : `Posted ${formatDate(existingReview!.createdAt)}`
                  }
                </span>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400">
                  ✓ Your review is live on the public website and helping prospective families learn about LBMAA!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Review Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <span className="text-primary">•</span>
            <p>Be honest and authentic about your family's experience</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">•</span>
            <p>Share specific examples of how LBMAA has impacted your children</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">•</span>
            <p>Keep your review respectful and constructive</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">•</span>
            <p>Focus on your personal experience with the instructors, programs, and community</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">•</span>
            <p>You can edit your review anytime to keep it current</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
