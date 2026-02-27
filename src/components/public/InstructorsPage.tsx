import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Award, Heart, Users, Target } from 'lucide-react';

export function InstructorsPage() {
  const instructors = [
    {
      name: 'Master Carlos Reyes',
      title: 'Head Instructor & Founder',
      belt: 'Black Belt - 5th Dan',
      specialties: ['Leadership', 'Youth Development', 'Advanced Techniques'],
      bio: 'Master Reyes has over 20 years of martial arts experience and a passion for helping young people discover their potential. His patient, encouraging teaching style creates an environment where every student feels valued and supported.',
      certifications: ['Certified Youth Instructor', 'Sports Safety Certified', 'CPR/First Aid']
    },
    {
      name: 'Instructor Maria Santos',
      title: 'Little Dragons Program Director',
      belt: 'Black Belt - 3rd Dan',
      specialties: ['Early Childhood Education', 'Motor Skills Development', 'Positive Reinforcement'],
      bio: 'With a background in early childhood education and years of experience teaching young children, Instructor Santos brings joy and enthusiasm to every Little Dragons class. She has a special gift for connecting with our youngest students.',
      certifications: ['Early Childhood Education Degree', 'Youth Martial Arts Specialist', 'CPR/First Aid']
    },
    {
      name: 'Instructor David Chen',
      title: 'Teen Program Instructor',
      belt: 'Black Belt - 4th Dan',
      specialties: ['Advanced Training', 'Competition Coaching', 'Fitness & Conditioning'],
      bio: 'Instructor Chen specializes in working with teenage students, helping them develop discipline, confidence, and leadership skills. His high-energy classes challenge students while maintaining a supportive and encouraging atmosphere.',
      certifications: ['Sport Martial Arts Coach', 'Strength & Conditioning Specialist', 'CPR/First Aid']
    },
    {
      name: 'Instructor Emily Rodriguez',
      title: 'Youth Program Instructor',
      belt: 'Black Belt - 2nd Dan',
      specialties: ['Character Development', 'Anti-Bullying Programs', 'Student Mentorship'],
      bio: 'Instructor Rodriguez is passionate about using martial arts as a tool for building confidence and character. She creates a warm, inclusive environment where every student feels they belong and can succeed.',
      certifications: ['Youth Development Specialist', 'Anti-Bullying Instructor', 'CPR/First Aid']
    }
  ];

  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Meet Our Instructors</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experienced, certified professionals who are dedicated to your child's growth and development
          </p>
        </div>

        {/* Why Our Instructors Are Different */}
        <div className="mb-16">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-center mb-8">What Sets Our Team Apart</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <div className="mx-auto mb-4 w-14 h-14 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                    <Award className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold mb-2">Certified Professionals</h4>
                  <p className="text-sm opacity-90">
                    All instructors are certified and regularly trained in the latest teaching methods
                  </p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-4 w-14 h-14 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                    <Heart className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold mb-2">Passionate Educators</h4>
                  <p className="text-sm opacity-90">
                    They don't just teach martial arts – they genuinely care about each student's success
                  </p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-4 w-14 h-14 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                    <Users className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold mb-2">Child Development Focus</h4>
                  <p className="text-sm opacity-90">
                    Specialized training in age-appropriate teaching and child psychology
                  </p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-4 w-14 h-14 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                    <Target className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold mb-2">Safety First</h4>
                  <p className="text-sm opacity-90">
                    CPR/First Aid certified with comprehensive safety training
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructor Profiles */}
        <div className="space-y-8 max-w-5xl mx-auto">
          {instructors.map((instructor, index) => (
            <Card key={index}>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center md:items-start">
                    <Avatar className="w-32 h-32 mb-4">
                      <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                        {instructor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <Badge className="bg-primary text-primary-foreground mb-2">
                      {instructor.belt}
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-1">{instructor.name}</h3>
                    <p className="text-lg text-primary mb-4">{instructor.title}</p>
                    
                    <p className="text-muted-foreground mb-4">
                      {instructor.bio}
                    </p>
                    
                    <div className="mb-4">
                      <h4 className="font-bold mb-2">Specialties:</h4>
                      <div className="flex flex-wrap gap-2">
                        {instructor.specialties.map((specialty, i) => (
                          <Badge key={i} variant="secondary">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-bold mb-2">Certifications:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {instructor.certifications.map((cert, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Teaching Philosophy */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="bg-secondary/30">
            <CardHeader>
              <CardTitle className="text-3xl text-center">Our Teaching Philosophy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                At LBMAA, we believe that every child learns differently and progresses at their own pace. 
                Our instructors are trained to recognize individual learning styles and adapt their teaching 
                to meet each student's needs.
              </p>
              <p>
                We use positive reinforcement to build confidence and motivation. Students are encouraged 
                to do their best, and every improvement – no matter how small – is celebrated. Mistakes are 
                viewed as valuable learning opportunities, not failures.
              </p>
              <p>
                Our instructors serve as role models, demonstrating the values we teach: respect, integrity, 
                discipline, and kindness. We maintain high standards while creating a supportive environment 
                where students feel safe to take risks and grow.
              </p>
              <p>
                Beyond martial arts techniques, we focus on developing the whole child – building character, 
                fostering leadership skills, and teaching life lessons that extend far beyond our dojo walls.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Background Checks Notice */}
        <div className="mt-8 max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                <strong>Your child's safety is our top priority.</strong> All instructors undergo comprehensive 
                background checks and are CPR/First Aid certified. We maintain strict safety protocols and 
                a zero-tolerance policy for any behavior that compromises student wellbeing.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
