import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Heart, Users, Award, Target, Shield, Sparkles } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">About LBMAA</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            More than a martial arts academy – we're a family dedicated to empowering young lives through discipline, respect, and community.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-16 bg-primary text-primary-foreground">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              To build confident, disciplined, and respectful young people through the practice of martial arts, 
              while creating a supportive community where every family feels welcome and valued.
            </p>
          </CardContent>
        </Card>

        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-4 w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Heart className="w-7 h-7 text-primary" />
                </div>
                <CardTitle>Respect</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We teach students to respect themselves, their peers, instructors, and their families. 
                  Respect is the foundation of everything we do.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Target className="w-7 h-7 text-primary" />
                </div>
                <CardTitle>Discipline</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Through consistent practice and goal-setting, students learn the value of hard work, 
                  self-control, and perseverance.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <CardTitle>Community</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We foster a supportive environment where families connect, students encourage each other, 
                  and everyone belongs.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Award className="w-7 h-7 text-primary" />
                </div>
                <CardTitle>Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We encourage every student to be their best self – not just in martial arts, 
                  but in school, at home, and in life.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <CardTitle>Integrity</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We teach students to do the right thing, even when no one is watching, 
                  and to stand up for what's right.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <CardTitle>Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Every student progresses at their own pace. We celebrate small victories and 
                  encourage continuous improvement.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Our Story */}
        <div className="mb-16">
          <Card className="bg-secondary/30">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
              <div className="max-w-3xl mx-auto space-y-4 text-muted-foreground">
                <p>
                  Los Banos Martial Arts Academy was founded with a simple belief: that every child deserves 
                  the opportunity to build confidence, learn discipline, and become part of a supportive community.
                </p>
                <p>
                  Our instructors are not just skilled martial artists – they're mentors, role models, and caring 
                  individuals who are passionate about helping young people reach their full potential. With years 
                  of experience teaching children of all ages and skill levels, our team creates a safe, 
                  encouraging environment where students can thrive.
                </p>
                <p>
                  We understand that choosing a martial arts academy is about more than just learning kicks and punches. 
                  It's about finding a place where your child feels valued, challenged, and supported. At LBMAA, 
                  we're committed to being that place for every family that walks through our doors.
                </p>
                <p>
                  Whether your child is shy and needs a confidence boost, full of energy and needs focus, or 
                  simply looking for a positive activity, we meet them where they are and help them grow into 
                  the best version of themselves.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* What Makes Us Different */}
        <div>
          <h2 className="text-4xl font-bold text-center mb-12">What Makes Us Different</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Individual Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We keep class sizes manageable to ensure every student receives personalized instruction 
                  and feedback. Your child is never just a number.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Family-Centered Approach</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We view parents as partners in their child's development. Through our portal and regular 
                  communication, you're always informed and involved.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Age-Appropriate Programs</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Our programs are specifically designed for different age groups, ensuring that instruction 
                  is developmentally appropriate and engaging.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Positive Environment</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We focus on positive reinforcement and encouragement. Students learn that mistakes are 
                  opportunities to grow, not reasons to feel discouraged.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Character Development</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Beyond physical skills, we emphasize respect, integrity, perseverance, and leadership. 
                  These lessons extend far beyond the dojo.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Community Connection</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Through events, parent blogs, and our online portal, families connect with each other 
                  and build lasting friendships.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
