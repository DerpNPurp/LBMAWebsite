import { useState } from 'react';
import { CheckCircle2, AlertCircle, X, Plus, MapPin } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { submitEnrollmentLeadWithTimeout } from '../../lib/supabase/client';
import { V3 } from './design';

const CONTACT_INFO = [
  { label: 'Phone', value: '(209) 555-0123', href: 'tel:+12095550123' },
  { label: 'Email', value: 'info@lbmaa.com', href: 'mailto:info@lbmaa.com' },
];

const HOURS = [
  { day: 'Mon – Fri', time: '3:00 – 8:30 PM' },
  { day: 'Saturday',  time: '9:00 AM – 2:00 PM' },
  { day: 'Sunday',    time: 'Closed' },
];

type ChildRow = { name: string; age: string };

function programLabel(age: string): { text: string; color: string } | null {
  const n = Number(age);
  if (!age || isNaN(n)) return null;
  if (n >= 4 && n <= 7)  return { text: 'Little Dragons · ages 4–7',  color: '#6d28d9' };
  if (n >= 8 && n <= 17) return { text: 'Youth Program · ages 8–17', color: '#1d4ed8' };
  return { text: 'Age must be 4–17', color: '#dc2626' };
}

export function ContactPage() {
  const [parentName,  setParentName]  = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [phone,       setPhone]       = useState('');
  const [message,     setMessage]     = useState('');
  const [children,    setChildren]    = useState<ChildRow[]>([{ name: '', age: '' }]);
  const [submitted,   setSubmitted]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addChild() {
    setChildren(prev => [...prev, { name: '', age: '' }]);
  }

  function removeChild(i: number) {
    setChildren(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateChild(i: number, field: 'name' | 'age', value: string) {
    setChildren(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    for (const c of children) {
      if (!c.name.trim() || !c.age) {
        setSubmitError('Each child must have a name and age.');
        return;
      }
      const age = Number(c.age);
      if (!Number.isInteger(age) || age < 4 || age > 17) {
        setSubmitError('We currently enroll ages 4–17. Please contact us directly for other inquiries.');
        return;
      }
    }

    setIsSubmitting(true);
    const { data, error } = await submitEnrollmentLeadWithTimeout(
      {
        parentName,
        parentEmail,
        phone: phone || undefined,
        message: message || undefined,
        sourcePage: 'contact',
        children: children.map(c => ({ name: c.name.trim(), age: Number(c.age) })),
      },
      12000,
    );

    if (error || !data) {
      setSubmitError(error?.message || 'Unable to submit right now. Please try again or call us directly.');
      setIsSubmitting(false);
      return;
    }
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div>
      {/* ── PAGE HERO ── */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: V3.surface, borderBottom: `1px solid ${V3.border}` }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <p className="v3-eyebrow mb-5">Get In Touch</p>
          <h1
            className="v3-h font-black leading-none mb-6"
            style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', color: V3.text, maxWidth: '18ch' }}
          >
            We'd Love to<br />Hear From You
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: V3.muted, maxWidth: '52ch' }}>
            Questions about our programs or ready to book a free trial? We'll respond within one business day — no sales calls, no pressure.
          </p>
        </div>
      </section>

      {/* ── CONTACT GRID ── */}
      <section className="py-14 lg:py-20" style={{ backgroundColor: V3.dark }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-[1fr_340px] gap-10 xl:gap-14 items-start">

            {/* ── FORM (white card on dark) ── */}
            <div className="rounded-2xl p-7 lg:p-10" style={{ backgroundColor: 'white' }}>
              <h2
                className="v3-h font-black mb-1"
                style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', color: V3.text }}
              >
                Send Us a Message
              </h2>
              <p className="text-base mb-8" style={{ color: V3.muted }}>
                Fill out the form and we'll be in touch within one business day.
              </p>

              {submitted ? (
                <div className="py-16 text-center rounded-xl" style={{ backgroundColor: V3.surface }}>
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ backgroundColor: V3.primaryBg }}
                  >
                    <CheckCircle2 className="w-8 h-8" style={{ color: V3.primary }} />
                  </div>
                  <h3 className="v3-h font-black mb-2" style={{ fontSize: '1.75rem', color: V3.text }}>
                    We Got Your Message
                  </h3>
                  <p className="text-base max-w-sm mx-auto leading-relaxed" style={{ color: V3.muted }}>
                    We'll be in touch within 24 hours to answer your questions and get your child scheduled for a free trial class.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="parentName" className="text-sm font-semibold" style={{ color: V3.text }}>
                        Your name <span style={{ color: V3.primary }}>*</span>
                      </Label>
                      <Input
                        id="parentName"
                        placeholder="Jane Smith"
                        value={parentName}
                        onChange={e => setParentName(e.target.value)}
                        disabled={isSubmitting}
                        required
                        className="min-h-[48px] text-base"
                        autoComplete="name"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="phone" className="text-sm font-semibold" style={{ color: V3.text }}>
                        Phone{' '}
                        <span className="font-normal" style={{ color: V3.muted }}>(optional)</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(209) 555-0100"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        disabled={isSubmitting}
                        className="min-h-[48px] text-base"
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="parentEmail" className="text-sm font-semibold" style={{ color: V3.text }}>
                      Email address <span style={{ color: V3.primary }}>*</span>
                    </Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      placeholder="you@example.com"
                      value={parentEmail}
                      onChange={e => setParentEmail(e.target.value)}
                      disabled={isSubmitting}
                      required
                      className="min-h-[48px] text-base"
                      autoComplete="email"
                    />
                  </div>

                  {/* Children section */}
                  <div
                    className="flex flex-col gap-3 rounded-xl p-5"
                    style={{ backgroundColor: V3.surface, border: `1px solid ${V3.border}` }}
                  >
                    <div>
                      <Label className="text-sm font-semibold" style={{ color: V3.text }}>
                        Children enrolling <span style={{ color: V3.primary }}>*</span>
                      </Label>
                      <p className="text-sm mt-1" style={{ color: V3.muted }}>
                        We use age to place your child in the right program
                      </p>
                    </div>

                    {children.map((child, i) => {
                      const pl = programLabel(child.age);
                      return (
                        <div key={i} className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Child's name"
                              value={child.name}
                              onChange={e => updateChild(i, 'name', e.target.value)}
                              disabled={isSubmitting}
                              required
                              className="min-h-[44px] flex-1 text-base bg-white"
                            />
                            <Input
                              type="number"
                              min={4}
                              max={17}
                              placeholder="Age"
                              value={child.age}
                              onChange={e => updateChild(i, 'age', e.target.value)}
                              disabled={isSubmitting}
                              required
                              className="min-h-[44px] w-20 text-base bg-white"
                            />
                            {children.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeChild(i)}
                                disabled={isSubmitting}
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                                style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {pl && (
                            <p className="text-sm font-medium pl-1" style={{ color: pl.color }}>{pl.text}</p>
                          )}
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={addChild}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 text-sm font-semibold self-start transition-opacity hover:opacity-70"
                      style={{ color: V3.primary }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add another child
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="message" className="text-sm font-semibold" style={{ color: V3.text }}>
                      Questions or notes{' '}
                      <span className="font-normal" style={{ color: V3.muted }}>(optional)</span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Preferred schedule, questions about programs, or anything else on your mind."
                      rows={4}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      disabled={isSubmitting}
                      className="text-base"
                    />
                  </div>

                  {submitError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="v3-btn-primary w-full"
                      style={{
                        opacity: isSubmitting ? 0.6 : 1,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        padding: '0.9rem 2rem',
                      }}
                    >
                      {isSubmitting ? 'Sending…' : 'Send Message'}
                    </button>
                    <p className="text-sm text-center" style={{ color: V3.muted }}>
                      * Required. We'll never share your information.
                    </p>
                  </div>

                </form>
              )}
            </div>

            {/* ── INFO SIDE (floats on dark) ── */}
            <div className="flex flex-col gap-8 pt-2">

              {/* Location */}
              <div>
                <p className="v3-eyebrow mb-3" style={{ color: 'oklch(72% 0.10 20)' }}>Location</p>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: V3.mutedOnDark }} />
                  <p className="text-base leading-relaxed" style={{ color: V3.onDark }}>
                    123 Main Street<br />Los Banos, CA 93635
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div style={{ borderTop: `1px solid ${V3.borderDark}`, paddingTop: '2rem' }}>
                <p className="v3-eyebrow mb-4" style={{ color: 'oklch(72% 0.10 20)' }}>Class Hours</p>
                <div className="flex flex-col gap-3">
                  {HOURS.map(({ day, time }) => (
                    <div key={day} className="flex justify-between text-base gap-4">
                      <span style={{ color: V3.onDark }}>{day}</span>
                      <span style={{ color: V3.mutedOnDark }}>{time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div style={{ borderTop: `1px solid ${V3.borderDark}`, paddingTop: '2rem' }}>
                <p className="v3-eyebrow mb-4" style={{ color: 'oklch(72% 0.10 20)' }}>Phone &amp; Email</p>
                <div className="flex flex-col gap-5">
                  {CONTACT_INFO.map(({ label, value, href }) => (
                    <div key={label}>
                      <p
                        className="uppercase tracking-wide mb-1"
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: '0.65rem',
                          letterSpacing: '0.15em',
                          fontWeight: 700,
                          color: V3.mutedOnDark,
                        }}
                      >
                        {label}
                      </p>
                      <a
                        href={href}
                        className="text-base font-semibold transition-opacity hover:opacity-75"
                        style={{ color: 'oklch(75% 0.10 20)' }}
                      >
                        {value}
                      </a>
                    </div>
                  ))}
                  <p className="text-sm" style={{ color: V3.mutedOnDark }}>We reply within 1 business day</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── MAP ── */}
      <section style={{ borderTop: `1px solid ${V3.border}` }}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${V3.border}` }}>
            <iframe
              title="LBMAA Location"
              src="https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=Los+Banos,CA"
              width="100%"
              height="320"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
