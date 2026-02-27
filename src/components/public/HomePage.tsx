import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { 
  Award, 
  Users, 
  Heart, 
  Target, 
  Shield,
  Star,
  Clock,
  MapPin,
  BookOpen,
  Infinity
} from 'lucide-react';

type HomePageProps = {
  onLogin: () => void;
};

export function HomePage({ onLogin }: HomePageProps) {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-foreground text-background">
        <div className="absolute inset-0 opacity-20">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1769095211505-fbcbf6530f02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJ0aWFsJTIwYXJ0cyUyMHRyYWluaW5nJTIwY2hpbGRyZW4lMjBkaXNjaXBsaW5lfGVufDF8fHx8MTc3MDg0NDE2Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Martial Arts Training"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative container mx-auto px-4 py-32">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Building Confidence, Discipline, and Community
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Where bodies grow strong, minds become disciplined, and lasting friendships are forged.
            </p>
          </div>
        </div>
      </section>

      {/* What Students Learn */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">What Your Child Will Learn</h2>
            <p className="text-xl text-muted-foreground">
              More than just martial arts – we build character and community
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Discipline</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Self-control, focus, and respect for themselves and others
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Build self-esteem through achievement and personal growth
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Improved concentration and mental clarity for school and life
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Respect</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Understanding the value of courtesy, humility, and teamwork
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Enhanced learning skills and academic performance through discipline
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Training Structure */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How We Train</h2>
            <p className="text-xl text-muted-foreground">
              Structured, progressive, and age-appropriate
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-2xl font-bold mb-3">Learn Fundamentals</h3>
              <p className="text-muted-foreground">
                Learn basic techniques, stances, and movements with patient, expert instruction
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-2xl font-bold mb-3">Practice & Progress</h3>
              <p className="text-muted-foreground">
                Regular classes with individualized feedback to build skills and confidence
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-2xl font-bold mb-3">Achieve Excellence</h3>
              <p className="text-muted-foreground">
                Earn belts, build character, and become part of our martial arts family
              </p>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <div className="text-center max-w-md">
              <div className="bg-primary text-primary-foreground rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Infinity className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Eternal Mastery</h3>
              <p className="text-muted-foreground">
                Training never stops
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Facility Overview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Facility</h2>
            <p className="text-xl text-muted-foreground">
              A safe, clean, and welcoming environment for students and parents alike
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-center">Safe & Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Padded training areas, supervised classes, and strict safety protocols
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Star className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-center">Professional Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Top-quality mats, bags, and training gear maintained to the highest standards
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-center">Family Friendly</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Comfortable parent lounge and viewing area with a welcoming community atmosphere
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl mb-8 opacity-90">
                SPECIAL Join our family today and give your child the gift of confidence, discipline, and lifelong skills.
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                className="text-lg px-8 py-6"
                onClick={onLogin}
              >
                5 Days for $20 - Start Today
              </Button>
              
              <div className="mt-12 grid gap-6 md:grid-cols-3 text-left">
                <div className="flex items-start gap-3">
                  <Clock className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">Flexible Schedule</h4>
                    <p className="text-sm opacity-90">Classes available throughout the week</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">Convenient Location</h4>
                    <p className="text-sm opacity-90">Easy access in Los Banos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">Caring Instructors</h4>
                    <p className="text-sm opacity-90">Experienced, patient, and dedicated</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}