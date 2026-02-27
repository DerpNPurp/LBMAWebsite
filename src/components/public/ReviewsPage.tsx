import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Star, Loader2 } from 'lucide-react';
import { getReviews } from '../../lib/supabase/queries';

type Review = {
  parentName: string;
  rating: number;
  date: string;
  review: string;
};

export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const reviewsData = await getReviews();
        
        // Format reviews for display
        const formattedReviews: Review[] = reviewsData.map((r: any) => {
          const createdAt = new Date(r.created_at);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          
          let dateStr = '';
          if (diffDays === 0) dateStr = 'Today';
          else if (diffDays === 1) dateStr = '1 day ago';
          else if (diffDays < 7) dateStr = `${diffDays} days ago`;
          else if (diffDays < 30) dateStr = `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
          else if (diffDays < 365) dateStr = `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
          else dateStr = `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;

          return {
            parentName: r.profiles?.display_name || r.families?.primary_email?.split('@')[0] || 'Anonymous',
            rating: r.rating,
            date: dateStr,
            review: r.review,
          };
        });

        setReviews(formattedReviews);
      } catch (error) {
        console.error('Error loading reviews:', error);
        // Fallback to empty array on error
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const mockReviews = [
    {
      parentName: 'Sarah Johnson',
      rating: 5,
      date: '2 weeks ago',
      review: 'My daughter Emma has been attending LBMAA for 6 months and the transformation has been incredible. She was very shy when she started, but now she\'s confident, focused, and excited to go to class. Master Reyes and the instructors are patient, encouraging, and truly care about each child\'s development. I couldn\'t be happier with our decision to enroll her here.'
    },
    {
      parentName: 'Michael Torres',
      rating: 5,
      date: '1 month ago',
      review: 'Both of my boys have been training at LBMAA for over a year. The discipline and respect they\'ve learned have carried over into every aspect of their lives – school, home, and with their friends. The instructors are fantastic, and the parent portal makes it so easy to stay connected and informed. Highly recommend!'
    },
    {
      parentName: 'Jennifer Martinez',
      rating: 5,
      date: '3 weeks ago',
      review: 'As a parent of a child with ADHD, I was worried about finding an activity that would work for him. LBMAA has been a game-changer. The structured environment and positive reinforcement have helped him develop focus and self-control. Instructor Santos is amazing with the Little Dragons – she has endless patience and makes every class fun.'
    },
    {
      parentName: 'David Chen',
      rating: 5,
      date: '2 months ago',
      review: 'The sense of community at LBMAA is unlike anything we\'ve experienced elsewhere. It\'s not just about martial arts – it\'s about building character, making friends, and being part of something special. Our family has connected with other families through the parent blog and group activities. We feel like we\'ve found our second home.'
    },
    {
      parentName: 'Lisa Anderson',
      rating: 5,
      date: '1 week ago',
      review: 'My son was being bullied at school and his self-esteem was really suffering. Since joining LBMAA, he\'s become so much more confident and assertive (in a positive way). He stands up for himself now, and the bullying has stopped. The anti-bullying program here is excellent, and the instructors genuinely care about the kids.'
    },
    {
      parentName: 'Robert Garcia',
      rating: 5,
      date: '5 weeks ago',
      review: 'What I appreciate most is how the instructors communicate with parents. Through the portal, I can see my daughter\'s progress, read instructor feedback, and stay informed about upcoming events. The instructors are always available if I have questions or concerns. It\'s this level of engagement that sets LBMAA apart.'
    },
    {
      parentName: 'Amanda White',
      rating: 5,
      date: '3 months ago',
      review: 'My teenage son was looking for something to help him stay active and focused during high school. The teen program at LBMAA has been perfect. The classes are challenging, the other students are respectful and supportive, and he\'s learned valuable leadership skills through the mentorship program. Instructor Chen is an excellent role model.'
    },
    {
      parentName: 'Carlos Rodriguez',
      rating: 5,
      date: '2 weeks ago',
      review: 'Clean facility, professional staff, and a warm, welcoming atmosphere. Our twins started in the Little Dragons program and now they\'re in the youth program. They\'ve made so much progress not just in martial arts, but in their behavior at home and school. The belt testing ceremonies are special moments our whole family looks forward to.'
    },
    {
      parentName: 'Michelle Lee',
      rating: 5,
      date: '1 month ago',
      review: 'I was hesitant about martial arts at first, but LBMAA completely changed my perspective. This isn\'t about teaching kids to fight – it\'s about teaching them respect, discipline, self-control, and how to be good people. My daughter loves her classes, and I love the positive influence it has on her. Worth every penny.'
    },
    {
      parentName: 'James Wilson',
      rating: 5,
      date: '4 weeks ago',
      review: 'As a single dad, finding activities that work with my schedule has been tough. LBMAA offers flexible class times and the staff is incredibly understanding when we need to reschedule. The parent community has been so supportive too – we\'ve even organized carpools through the group chat. Couldn\'t ask for more.'
    },
    {
      parentName: 'Patricia Brown',
      rating: 5,
      date: '6 weeks ago',
      review: 'The $10 trial week was the best decision we made. It gave my daughter a chance to try it out with no pressure, and by day 3, she was hooked. The instructors made her feel welcome from day one. Now she\'s working toward her yellow belt and couldn\'t be more proud of herself. Thank you, LBMAA!'
    },
    {
      parentName: 'Thomas Kim',
      rating: 5,
      date: '2 months ago',
      review: 'What stands out most is the individual attention each child receives. Even in a class with multiple students, the instructors make sure everyone is progressing and no one gets left behind. My son has special needs, and they\'ve been incredibly accommodating and patient with him. We are so grateful for this academy.'
    }
  ];

  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Parent Reviews</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Hear from families who have experienced the LBMAA difference
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-6">
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-6 h-6 fill-primary text-primary" />
                  ))}
                </div>
                <span className="text-2xl font-bold">
                  {reviews.length > 0 
                    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                    : '5.0'
                  }
                </span>
                <span className="text-muted-foreground">({reviews.length} reviews)</span>
              </>
            )}
          </div>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            {reviews.map((review, index) => (
            <Card key={index} className="flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="text-sm bg-primary/10 text-primary">
                      {review.parentName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-bold">{review.parentName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-4 h-4 ${
                              star <= review.rating 
                                ? 'fill-primary text-primary' 
                                : 'text-muted'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground flex-1">
                  "{review.review}"
                </p>
              </CardContent>
            </Card>
            ))}
          </div>
        )}

        {/* Notice */}
        <div className="mt-16 max-w-3xl mx-auto">
          <Card className="bg-secondary/30">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold mb-3">Authentic Reviews</h3>
              <p className="text-muted-foreground">
                All reviews are from real LBMAA families. We believe in transparency and authenticity. 
                Reviews are not moderated or edited – these are genuine experiences shared by parents 
                in our community.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground mb-4">
            Ready to join our family and create your own success story?
          </p>
          <p className="text-2xl font-bold text-primary">
            5 days for $10 - Start today
          </p>
        </div>
      </div>
    </div>
  );
}