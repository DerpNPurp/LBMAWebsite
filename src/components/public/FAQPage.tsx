import { Card, CardContent } from '../ui/card';
import { 
  HelpCircle, 
  Clock, 
  DollarSign, 
  Users, 
  Award, 
  Heart,
  Calendar,
  Shield
} from 'lucide-react';

export function FAQPage() {
  const faqs = [
    {
      category: 'Getting Started',
      icon: HelpCircle,
      questions: [
        {
          q: 'How do I get started?',
          a: 'Simply sign up for our 5-day trial for $10. This gives your child 5 days to try out classes and see if LBMAA is the right fit. No long-term commitment required for the trial period.'
        },
        {
          q: 'What should my child wear to their first class?',
          a: 'For the trial week, comfortable athletic clothing (t-shirt and sweatpants or shorts) is perfect. Bare feet are required on the mat. If your child continues after the trial, we\'ll help you get their official uniform.'
        },
        {
          q: 'Do parents stay and watch?',
          a: 'We have a comfortable viewing area where parents are welcome to watch classes. Many parents enjoy seeing their children learn and progress. However, it\'s not required – you\'re welcome to drop off and pick up if that works better for your schedule.'
        },
        {
          q: 'Is there a minimum commitment?',
          a: 'After the trial week, we offer flexible membership options. We\'ll discuss what works best for your family. Our goal is to make martial arts accessible and convenient.'
        }
      ]
    },
    {
      category: 'Class Information',
      icon: Clock,
      questions: [
        {
          q: 'How long are classes?',
          a: 'Little Dragons (ages 4-6): 30 minutes\nYouth Program (ages 7-12): 45 minutes\nTeen Program (ages 13-17): 60 minutes\n\nClasses are designed to match the attention span and energy level of each age group.'
        },
        {
          q: 'What days and times do you offer classes?',
          a: 'We offer classes throughout the week, including evenings and weekends to accommodate busy family schedules. Contact us for the current schedule, as class times may vary by program and enrollment.'
        },
        {
          q: 'What if my child misses a class?',
          a: 'We understand that schedules can be unpredictable. We offer makeup classes and work with families to ensure consistent training. You can manage your schedule through our parent portal.'
        },
        {
          q: 'How many students are in each class?',
          a: 'We keep class sizes small to ensure every child receives individual attention. Typically, classes have 10-15 students with multiple instructors, so the student-to-teacher ratio remains low.'
        }
      ]
    },
    {
      category: 'Programs & Progress',
      icon: Award,
      questions: [
        {
          q: 'Which program is right for my child?',
          a: 'Programs are based on age:\n• Little Dragons: Ages 4-6\n• Youth Program: Ages 7-12\n• Teen Program: Ages 13-17\n\nEach program is designed specifically for that age group\'s developmental stage.'
        },
        {
          q: 'How long does it take to earn a black belt?',
          a: 'The journey to black belt typically takes 4-6 years of consistent training. However, every student progresses at their own pace. The focus is on genuine skill development and character growth, not just speed.'
        },
        {
          q: 'When does belt testing happen?',
          a: 'Belt testing is held every 2-3 months for students who are ready. Instructors assess readiness based on skill level, attitude, and attendance. Not every student tests at every opportunity, and that\'s okay – we focus on individual progress.'
        },
        {
          q: 'What if my child has special needs?',
          a: 'We welcome students of all abilities and learning styles. Our instructors are trained to adapt teaching methods to individual needs. Please discuss your child\'s specific needs with us so we can ensure they have the best possible experience.'
        }
      ]
    },
    {
      category: 'Safety & Environment',
      icon: Shield,
      questions: [
        {
          q: 'Is martial arts safe for children?',
          a: 'Yes! Safety is our top priority. We use age-appropriate techniques, proper safety equipment, padded training areas, and close supervision. Our instructors are CPR/First Aid certified and trained in safety protocols.'
        },
        {
          q: 'Will my child learn to fight?',
          a: 'We teach self-defense and martial arts techniques, but the emphasis is on discipline, respect, and using martial arts as a last resort. Students learn when it\'s appropriate to use their skills (only in genuine self-defense) and the importance of conflict resolution.'
        },
        {
          q: 'What are your safety protocols?',
          a: 'All instructors undergo background checks, we maintain strict supervision ratios, require signed waivers, follow safety guidelines for all activities, and maintain a clean, well-maintained facility. We also have clear protocols for injuries and emergencies.'
        },
        {
          q: 'Do you teach anti-bullying?',
          a: 'Yes! Anti-bullying education is integrated into our curriculum. Students learn how to recognize bullying, strategies to avoid and de-escalate confrontations, when to seek help from adults, and how to stand up for themselves and others appropriately.'
        }
      ]
    },
    {
      category: 'Parent Communication',
      icon: Users,
      questions: [
        {
          q: 'How do I stay informed about my child\'s progress?',
          a: 'Our parent portal allows you to view your child\'s belt level, see instructor feedback, read announcements, access the parent blog, and communicate with instructors. You\'ll always know how your child is doing.'
        },
        {
          q: 'Can I communicate with instructors?',
          a: 'Absolutely! You can message instructors directly through the parent portal, speak with them before or after class, or schedule a meeting. We encourage open communication between parents and instructors.'
        },
        {
          q: 'How do I know about schedule changes or events?',
          a: 'All announcements, schedule changes, and upcoming events are posted in the parent portal and sent via email. You\'ll never miss important information.'
        },
        {
          q: 'Can I connect with other parents?',
          a: 'Yes! Our parent portal includes a community blog where parents can share experiences, ask questions, and connect with each other. Many families form lasting friendships through LBMAA.'
        }
      ]
    },
    {
      category: 'Practical Information',
      icon: Calendar,
      questions: [
        {
          q: 'Where are you located?',
          a: '123 Main Street, Los Banos, CA 93635. We have ample parking and are easily accessible from anywhere in Los Banos.'
        },
        {
          q: 'What equipment does my child need?',
          a: 'For the trial week, just comfortable clothes. If your child continues, you\'ll need:\n• Official uniform (we can help you order)\n• Belt (provided with uniform)\n• Protective gear for sparring (we\'ll discuss when the time comes)\n\nWe keep costs reasonable and offer payment plans for equipment if needed.'
        },
        {
          q: 'Do you offer family discounts?',
          a: 'Yes! We offer discounts when multiple children from the same family enroll. Ask us about family rates when you sign up.'
        },
        {
          q: 'What if we need to take a break?',
          a: 'Life happens! If you need to pause your membership temporarily (due to family vacation, medical reasons, etc.), just let us know. We work with families to find solutions that work for everyone.'
        }
      ]
    }
  ];

  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to know about LBMAA. Don\'t see your question? Contact us directly!
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-12 max-w-5xl mx-auto">
          {faqs.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <section.icon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold">{section.category}</h2>
              </div>
              
              <div className="space-y-4">
                {section.questions.map((item, qIndex) => (
                  <Card key={qIndex}>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold mb-3 text-primary">{item.q}</h3>
                      <p className="text-muted-foreground whitespace-pre-line">{item.a}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions? */}
        <div className="mt-16 max-w-3xl mx-auto">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
              <p className="text-lg opacity-90 mb-6">
                We\'re here to help! Reach out and we\'ll be happy to answer any questions you have 
                about our programs, facility, or enrollment process.
              </p>
              <div className="space-y-2">
                <p><strong>Email:</strong> info@lbmaa.com</p>
                <p><strong>Phone:</strong> (209) 555-0123</p>
                <p><strong>Address:</strong> 123 Main Street, Los Banos, CA 93635</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trial CTA */}
        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground mb-2">
            The best way to know if LBMAA is right for your family is to experience it firsthand.
          </p>
          <p className="text-2xl font-bold text-primary">
            5 days for $10 - Start today
          </p>
        </div>
      </div>
    </div>
  );
}