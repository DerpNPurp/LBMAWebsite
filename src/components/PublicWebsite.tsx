import { useState } from 'react';
import { HomePage } from './public/HomePage';
import { AboutPage } from './public/AboutPage';
import { ProgramsPage } from './public/ProgramsPage';
import { InstructorsPage } from './public/InstructorsPage';
import { ReviewsPage } from './public/ReviewsPage';
import { FAQPage } from './public/FAQPage';
import { ContactPage } from './public/ContactPage';
import { Button } from './ui/button';
import { Shield } from 'lucide-react';

type PublicWebsiteProps = {
  onLogin: () => void;
};

export function PublicWebsite({ onLogin }: PublicWebsiteProps) {
  const [activePage, setActivePage] = useState('home');

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">Los Banos Martial Arts Academy</span>
            </div>
            
            <div className="hidden md:flex items-center gap-1">
              <Button
                variant={activePage === 'home' ? 'default' : 'ghost'}
                onClick={() => setActivePage('home')}
              >
                Home
              </Button>
              <Button
                variant={activePage === 'about' ? 'default' : 'ghost'}
                onClick={() => setActivePage('about')}
              >
                About
              </Button>
              <Button
                variant={activePage === 'programs' ? 'default' : 'ghost'}
                onClick={() => setActivePage('programs')}
              >
                Programs
              </Button>
              <Button
                variant={activePage === 'instructors' ? 'default' : 'ghost'}
                onClick={() => setActivePage('instructors')}
              >
                Instructors
              </Button>
              <Button
                variant={activePage === 'reviews' ? 'default' : 'ghost'}
                onClick={() => setActivePage('reviews')}
              >
                Reviews
              </Button>
              <Button
                variant={activePage === 'faq' ? 'default' : 'ghost'}
                onClick={() => setActivePage('faq')}
              >
                FAQ
              </Button>
              <Button
                variant={activePage === 'contact' ? 'default' : 'ghost'}
                onClick={() => setActivePage('contact')}
              >
                Contact
              </Button>
              <Button
                variant="outline"
                onClick={onLogin}
                className="ml-4"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main>
        {activePage === 'home' && <HomePage onLogin={onLogin} />}
        {activePage === 'about' && <AboutPage />}
        {activePage === 'programs' && <ProgramsPage />}
        {activePage === 'instructors' && <InstructorsPage />}
        {activePage === 'reviews' && <ReviewsPage />}
        {activePage === 'faq' && <FAQPage />}
        {activePage === 'contact' && <ContactPage />}
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-background border-t mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <span className="font-bold">LBMAA</span>
              </div>
              <p className="text-sm opacity-80">
                Building confidence, discipline, and community through martial arts excellence.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm opacity-80">
                <button onClick={() => setActivePage('about')} className="block hover:opacity-100">About Us</button>
                <button onClick={() => setActivePage('programs')} className="block hover:opacity-100">Our Programs</button>
                <button onClick={() => setActivePage('instructors')} className="block hover:opacity-100">Instructors</button>
                <button onClick={() => setActivePage('faq')} className="block hover:opacity-100">FAQ</button>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <div className="space-y-2 text-sm opacity-80">
                <p>Email: info@lbmaa.com</p>
                <p>Phone: (209) 555-0123</p>
                <p>123 Main Street<br />Los Banos, CA 93635</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-background/10 text-center text-sm opacity-60">
            © 2026 Los Banos Martial Arts Academy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
