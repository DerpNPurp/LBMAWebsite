import { useState, useEffect } from 'react';
import { HomePage } from './public/HomePage';
import { AboutPage } from './public/AboutPage';
import { ProgramsPage } from './public/ProgramsPage';
import { InstructorsPage } from './public/InstructorsPage';
import { ReviewsPage } from './public/ReviewsPage';
import { FAQPage } from './public/FAQPage';
import { ContactPage } from './public/ContactPage';
import { FacilitiesPage } from './public/FacilitiesPage';
import { Button } from './ui/button';
import { Shield, Menu, X } from 'lucide-react';

type Page = 'home' | 'about' | 'facilities' | 'programs' | 'instructors' | 'reviews' | 'faq' | 'contact';

type PublicWebsiteProps = {
  onLogin: () => void;
};

const NAV_LINKS: { label: string; page: Page }[] = [
  { label: 'About', page: 'about' },
  { label: 'Facilities', page: 'facilities' },
  { label: 'Programs', page: 'programs' },
  { label: 'Instructors', page: 'instructors' },
  { label: 'Reviews', page: 'reviews' },
  { label: 'FAQ', page: 'faq' },
  { label: 'Contact', page: 'contact' },
];

export function PublicWebsite({ onLogin }: PublicWebsiteProps) {
  const [activePage, setActivePage] = useState<Page>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activePage]);

  const navigate = (page: Page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => navigate('home')}
              className="flex items-center gap-2.5 hover:opacity-75 transition-opacity"
            >
              <Shield className="w-7 h-7 text-primary flex-shrink-0" />
              <span className="font-bold text-foreground leading-tight text-sm md:text-base">
                Los Banos Martial Arts Academy
              </span>
            </button>

            {/* Desktop nav — underline active, ghost inactive */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ label, page }) => (
                <button
                  key={page}
                  onClick={() => navigate(page)}
                  className={`px-3 min-h-[44px] text-sm transition-colors rounded-md ${
                    activePage === page
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground font-medium'
                  }`}
                  aria-current={activePage === page ? 'page' : undefined}
                >
                  {label}
                  {activePage === page && (
                    <span className="block h-[2px] mt-0.5 bg-primary rounded-full" />
                  )}
                </button>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={onLogin}
                className="ml-3 text-sm"
              >
                Family Portal
              </Button>
            </div>

            {/* Mobile controls */}
            <div className="flex items-center gap-2 md:hidden">
              <Button variant="outline" size="sm" onClick={onLogin} className="text-xs">
                Portal
              </Button>
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div id="mobile-nav" className="md:hidden border-t bg-white">
            <div className="container mx-auto px-4 py-2 flex flex-col">
              <button
                onClick={() => navigate('home')}
                className={`text-left px-3 min-h-[44px] flex items-center rounded-md text-sm font-medium transition-colors ${
                  activePage === 'home' ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-accent'
                }`}
                aria-current={activePage === 'home' ? 'page' : undefined}
              >
                Home
              </button>
              {NAV_LINKS.map(({ label, page }) => (
                <button
                  key={page}
                  onClick={() => navigate(page)}
                  className={`text-left px-3 min-h-[44px] flex items-center rounded-md text-sm font-medium transition-colors ${
                    activePage === page ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-accent'
                  }`}
                  aria-current={activePage === page ? 'page' : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ── Page Content ── */}
      <main>
        {activePage === 'home' && (
          <HomePage onRequestEnrollment={() => navigate('contact')} />
        )}
        {activePage === 'about' && <AboutPage onRequestEnrollment={() => navigate('contact')} />}
        {activePage === 'facilities' && <FacilitiesPage onRequestEnrollment={() => navigate('contact')} />}
        {activePage === 'programs' && <ProgramsPage onRequestEnrollment={() => navigate('contact')} />}
        {activePage === 'instructors' && <InstructorsPage />}
        {activePage === 'reviews' && <ReviewsPage />}
        {activePage === 'faq' && <FAQPage />}
        {activePage === 'contact' && <ContactPage />}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#1B1212] text-slate-300 mt-24">
        <div className="container mx-auto px-4 py-14">
          <div className="grid gap-10 md:grid-cols-3">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-bold text-white text-sm">LBMAA</span>
              </div>
              <p className="text-sm leading-relaxed opacity-70 max-w-xs">
                A family-run martial arts school in Los Banos, CA. Teaching children
                confidence, discipline, and respect since day one.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Quick Links</h4>
              <div className="space-y-2.5">
                {[{ label: 'Home', page: 'home' as Page }, ...NAV_LINKS].map(({ label, page }) => (
                  <button
                    key={page}
                    onClick={() => navigate(page)}
                    className="block text-sm text-slate-400 hover:text-white transition-colors text-left"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Contact</h4>
              <div className="space-y-2.5 text-sm text-slate-400">
                <p>
                  <a href="mailto:info@lbmaa.com" className="hover:text-white transition-colors">
                    info@lbmaa.com
                  </a>
                </p>
                <p>
                  <a href="tel:+12095550123" className="hover:text-white transition-colors">
                    (209) 555-0123
                  </a>
                </p>
                <p>123 Main Street<br />Los Banos, CA 93635</p>
                <p className="pt-1">
                  Mon–Fri: 3:00 – 8:30 PM<br />
                  Saturday: 9:00 AM – 2:00 PM
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <span>© 2026 Los Banos Martial Arts Academy. All rights reserved.</span>
            <button onClick={onLogin} className="hover:text-slate-300 transition-colors underline">
              Family Portal Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
