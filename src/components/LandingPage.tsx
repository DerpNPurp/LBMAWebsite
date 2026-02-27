import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Mail, MapPin, Phone, Users, Award, Heart, Shield, Star } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

type LandingPageProps = {
  onLogin: (email: string) => void;
  isLoggingIn: boolean;
};

export function LandingPage({ onLogin, isLoggingIn }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [enrollEmail, setEnrollEmail] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleEnroll = () => {
    if (enrollEmail) {
      // Simulate sending email to admin
      alert(`Enrollment request sent! We'll contact you at ${enrollEmail} shortly.`);
      setEnrollEmail('');
    }
  };

  const handleLoginSubmit = () => {
    if (email) {
      onLogin(email);
      setEmailSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Los Banos Martial Arts Academy</h1>
              <p className="text-sm opacity-90 mt-1">Proudly affiliated with Ernie Reyes West Coast World Martial Arts</p>
            </div>
            <Button 
              variant="outline" 
              className="bg-background text-primary hover:bg-background/90 border-background"
              onClick={() => setShowLoginForm(!showLoginForm)}
            >
              Parent Portal Login
            </Button>
          </div>
        </div>
      </header>

      {/* Login Form Dropdown */}
      {showLoginForm && (
        <div className="bg-secondary border-b border-border">
          <div className="container mx-auto px-4 py-6 max-w-md">
            <Card>
              <CardHeader>
                <CardTitle>Parent Portal Login</CardTitle>
                <CardDescription>
                  Enter your email to receive a secure login link
                </CardDescription>
              </CardHeader>
              <CardContent>
                {emailSent ? (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                      <Mail className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="font-medium">Check your email!</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      We've sent a login link to {email}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleLoginSubmit()}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleLoginSubmit}
                      disabled={!email || isLoggingIn}
                    >
                      {isLoggingIn ? 'Sending...' : 'Send Login Link'}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      For demo: use any email (use "admin@lbmaa.com" for admin view)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Hero Image & CTA */}
      <section className="relative">
        <div className="relative h-[500px] overflow-hidden">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1769095211505-fbcbf6530f02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJ0aWFsJTIwYXJ0cyUyMGNoaWxkcmVuJTIwdHJhaW5pbmd8ZW58MXx8fHwxNzcwMzI3ODcwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Children training in martial arts"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h2 className="text-5xl font-bold mb-4">
                Where Champions Are Made
              </h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                Building character, discipline, and confidence in Los Banos' youth since our founding
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="bg-background text-primary hover:bg-background/90">
                  Start 7-Day Free Trial
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-primary">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="font-semibold mb-2">Character Development</h3>
              <p className="text-sm text-muted-foreground">
                Building confidence, respect, and leadership skills
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="font-semibold mb-2">Expert Instruction</h3>
              <p className="text-sm text-muted-foreground">
                Certified instructors with years of experience
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="font-semibold mb-2">Family Community</h3>
              <p className="text-sm text-muted-foreground">
                A welcoming environment for all families
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="font-semibold mb-2">Proven Results</h3>
              <p className="text-sm text-muted-foreground">
                Hundreds of successful students and families
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Programs</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Age-appropriate training designed to help every student reach their full potential
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Little Dragons (Ages 4-6)</CardTitle>
                <Badge className="w-fit">Beginner Friendly</Badge>
              </CardHeader>
              <CardContent>
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1769095216189-0ae27b6cc726?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRzJTIwa2FyYXRlJTIwY2xhc3N8ZW58MXx8fHwxNzcwMzAzMjgzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Little Dragons class"
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
                <ul className="space-y-2 text-sm">
                  <li>• Basic motor skill development</li>
                  <li>• Focus and discipline training</li>
                  <li>• Fun, engaging activities</li>
                  <li>• Confidence building</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Youth Program (Ages 7-12)</CardTitle>
                <Badge className="w-fit bg-blue-500">Most Popular</Badge>
              </CardHeader>
              <CardContent>
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1769095211505-fbcbf6530f02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJ0aWFsJTIwYXJ0cyUyMGNoaWxkcmVuJTIwdHJhaW5pbmd8ZW58MXx8fHwxNzcwMzI3ODcwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Youth program"
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
                <ul className="space-y-2 text-sm">
                  <li>• Traditional martial arts techniques</li>
                  <li>• Character development</li>
                  <li>• Self-defense skills</li>
                  <li>• Belt progression system</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teen & Adult (Ages 13+)</CardTitle>
                <Badge className="w-fit bg-orange-500">Advanced Training</Badge>
              </CardHeader>
              <CardContent>
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1738835934988-ed0d238e8299?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJ0aWFsJTIwYXJ0cyUyMGluc3RydWN0b3IlMjB0ZWFjaGluZ3xlbnwxfHx8fDE3NzAzMjc4NzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Teen and adult training"
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
                <ul className="space-y-2 text-sm">
                  <li>• Advanced techniques and forms</li>
                  <li>• Physical fitness and conditioning</li>
                  <li>• Leadership development</li>
                  <li>• Competition preparation</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">What Families Say</h2>
            <p className="text-xl text-muted-foreground">
              Hear from our amazing community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-4 italic">
                  "My son has been attending for 2 years and the growth in his confidence and discipline is amazing. The instructors truly care about each child's development."
                </p>
                <p className="font-semibold">- Maria G.</p>
                <p className="text-sm text-muted-foreground">Parent of 2 students</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-4 italic">
                  "Best decision we made for our daughter! She's learned self-defense, made great friends, and the family atmosphere is wonderful."
                </p>
                <p className="font-semibold">- Robert T.</p>
                <p className="text-sm text-muted-foreground">Parent of 1 student</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-4 italic">
                  "The instructors are patient, knowledgeable, and create a positive learning environment. Our kids love going to class!"
                </p>
                <p className="font-segibold">- Jennifer L.</p>
                <p className="text-sm text-muted-foreground">Parent of 3 students</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enrollment CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Start your child's martial arts journey with a FREE 7-day trial. No commitment required!
          </p>
          
          <Card className="bg-background text-foreground border-0">
            <CardHeader>
              <CardTitle>Request Your Free Trial</CardTitle>
              <CardDescription>
                Enter your email and we'll contact you within 24 hours to schedule your first class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={enrollEmail}
                  onChange={(e) => setEnrollEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleEnroll} disabled={!enrollEmail} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="programs">Programs</TabsTrigger>
              <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>What ages do you teach?</CardTitle>
                </CardHeader>
                <CardContent>
                  We offer programs for children as young as 4 years old through adults. Our classes are age-appropriate and skill-level based.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Do I need previous experience?</CardTitle>
                </CardHeader>
                <CardContent>
                  No experience necessary! We welcome beginners and work with each student at their own pace.
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="programs" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>How often are classes?</CardTitle>
                </CardHeader>
                <CardContent>
                  Classes are held multiple times per week. Families can choose the schedule that works best for them.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>What will my child learn?</CardTitle>
                </CardHeader>
                <CardContent>
                  Students learn traditional martial arts techniques, forms, self-defense, and important life skills like discipline, respect, and perseverance.
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="enrollment" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>How do I enroll?</CardTitle>
                </CardHeader>
                <CardContent>
                  Simply fill out the enrollment form above, and one of our staff members will contact you to schedule your free trial and complete registration.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>What should we bring to the first class?</CardTitle>
                </CardHeader>
                <CardContent>
                  Comfortable athletic clothing and a water bottle. We'll provide everything else for your trial period.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Contact Section */}
      <footer className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Contact Us</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>Los Banos Martial Arts Academy</p>
                    <p className="text-sm text-muted-foreground">Los Banos, CA</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 flex-shrink-0" />
                  <p>(555) 123-4567</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 flex-shrink-0" />
                  <p>info@lbmaa.com</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Hours</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Monday - Friday:</span>
                  <span>3:00 PM - 8:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span>9:00 AM - 12:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Affiliated With</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Ernie Reyes West Coast World Martial Arts Association
              </p>
              <a 
                href="https://erniereyes.com/los-banos" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Visit Main Website →
              </a>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2026 Los Banos Martial Arts Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
