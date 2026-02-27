import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Sparkles, Users, Zap, Award, Clock, Target } from 'lucide-react';

export function ProgramsPage() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Our Programs</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Age-appropriate martial arts training designed to meet your child where they are and help them grow.
          </p>
        </div>

        {/* Programs */}
        <div className="space-y-12 max-w-5xl mx-auto">
          {/* Little Dragons */}
          <Card className="overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3 relative h-64 md:h-auto">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1635962005741-a9c4904d110b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMGthcmF0ZSUyMGNsYXNzJTIwZ3JvdXB8ZW58MXx8fHwxNzcwODQ0MTY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Little Dragons Program"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">Ages 4-6</Badge>
                </div>
              </div>
              <div className="md:w-2/3">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-3xl">Little Dragons</CardTitle>
                  </div>
                  <CardDescription className="text-lg">
                    A fun, energetic introduction to martial arts for our youngest students
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Our Little Dragons program is specially designed for young children who are just beginning 
                    their martial arts journey. Through games, activities, and age-appropriate instruction, 
                    we help develop motor skills, listening skills, and basic discipline.
                  </p>
                  
                  <div className="space-y-3">
                    <h4 className="font-bold">Program Highlights:</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Focus on fun and engagement while building foundational skills</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Small class sizes for individualized attention</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Award className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Positive reinforcement and achievement recognition</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>30-minute classes designed for young attention spans</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4">
                    <h4 className="font-bold mb-2">What They'll Learn:</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Basic Stances</Badge>
                      <Badge variant="secondary">Coordination</Badge>
                      <Badge variant="secondary">Listening Skills</Badge>
                      <Badge variant="secondary">Following Directions</Badge>
                      <Badge variant="secondary">Social Skills</Badge>
                      <Badge variant="secondary">Confidence</Badge>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>

          {/* Youth Program */}
          <Card className="overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3 relative h-64 md:h-auto md:order-2">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1769095211505-fbcbf6530f02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJ0aWFsJTIwYXJ0cyUyMHRyYWluaW5nJTIwY2hpbGRyZW4lMjBkaXNjaXBsaW5lfGVufDF8fHx8MTc3MDg0NDE2Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Youth Program"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">
                    Ages 7-17
                  </Badge>
                </div>
              </div>
              <div className="md:w-2/3 md:order-1">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-3xl">Youth Program</CardTitle>
                  </div>
                  <CardDescription className="text-lg">
                    Building discipline, confidence, and skills for elementary-aged students
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Our Youth Program is where students begin to develop real martial arts skills while 
                    building character traits that will serve them throughout their lives. With a focus 
                    on discipline, respect, and personal growth, students thrive in a structured yet 
                    supportive environment.
                  </p>
                  
                  <div className="space-y-3">
                    <h4 className="font-bold">Program Highlights:</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Structured curriculum with clear progression goals</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Emphasis on teamwork and supporting fellow students</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Award className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Regular belt testing and achievement milestones</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>45-minute classes with balanced physical and mental training</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4">
                    <h4 className="font-bold mb-2">What They'll Learn:</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Advanced Techniques</Badge>
                      <Badge variant="secondary">Self-Defense</Badge>
                      <Badge variant="secondary">Focus & Discipline</Badge>
                      <Badge variant="secondary">Goal Setting</Badge>
                      <Badge variant="secondary">Leadership Skills</Badge>
                      <Badge variant="secondary">Perseverance</Badge>
                      <Badge variant="secondary">Respect</Badge>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>

          {/* Teen Program */}
          <Card className="overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3 relative h-64 md:h-auto">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1720495369604-289694ddabb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJ0aWFsJTIwYXJ0cyUyMGJlbHQlMjBwcm9ncmVzc2lvbnxlbnwxfHx8fDE3NzA4NDQxNjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Teen Program"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">
                    Ages 13-17
                  </Badge>
                </div>
              </div>
              <div className="md:w-2/3">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-3xl">Extreme Performance</CardTitle>
                  </div>
                  <CardDescription className="text-lg">
                    Advanced training and leadership development for teenage students
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Our Teen Program challenges students physically and mentally while developing leadership 
                    qualities and life skills. Teens learn advanced martial arts techniques, build strength 
                    and fitness, and become positive role models for younger students.
                  </p>
                  
                  <div className="space-y-3">
                    <h4 className="font-bold">Program Highlights:</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>High-level martial arts training and technique refinement</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Leadership opportunities as mentors to younger students</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Award className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Path to black belt and beyond</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>60-minute intensive classes with fitness conditioning</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4">
                    <h4 className="font-bold mb-2">What They'll Learn:</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Advanced Techniques</Badge>
                      <Badge variant="secondary">Leadership</Badge>
                      <Badge variant="secondary">Mentorship</Badge>
                      <Badge variant="secondary">Physical Fitness</Badge>
                      <Badge variant="secondary">Self-Discipline</Badge>
                      <Badge variant="secondary">Integrity</Badge>
                      <Badge variant="secondary">Community Service</Badge>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        </div>

        {/* Class Schedule Section */}
        <div className="mt-16 max-w-5xl mx-auto">
          <Card className="bg-secondary/30">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-center">Flexible Scheduling</h2>
              <p className="text-center text-muted-foreground mb-6">
                We offer classes throughout the week to accommodate busy family schedules. 
                Contact us to learn more about class times and availability.
              </p>
              <div className="text-center">
                <p className="text-xl mb-8 opacity-90">
                  <strong>Ready to join?</strong> Start with our 5-day trial for just $10 and find the perfect program for your child.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}