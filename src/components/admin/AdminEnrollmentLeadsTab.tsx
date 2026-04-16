import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Mail, Phone, User, Calendar, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { edgeFunctionUserAuthHeaders, supabase } from '../../lib/supabase/client';
import { getEnrollmentLeads } from '../../lib/supabase/queries';
import { updateLeadStatus, updateLeadAdminNotes } from '../../lib/supabase/mutations';
import type { EnrollmentLead } from '../../lib/types';
import { DenyModal } from './DenyModal';
import { PickDateModal } from './PickDateModal';
import { NewLeadModal } from './NewLeadModal';

// ─── Tab config ────────────────────────────────────────────────────────────

type TabId =
  | 'new'
  | 'approved'
  | 'appointment_scheduled'
  | 'appointment_confirmed'
  | 'denied_closed'
  | 'all';

const TABS: { id: TabId; label: string; statuses?: EnrollmentLead['status'][] }[] = [
  { id: 'new',                   label: 'New',             statuses: ['new'] },
  { id: 'approved',              label: 'Approved',        statuses: ['approved'] },
  { id: 'appointment_scheduled', label: 'Scheduled',       statuses: ['appointment_scheduled'] },
  { id: 'appointment_confirmed', label: 'Confirmed',       statuses: ['appointment_confirmed'] },
  { id: 'denied_closed',         label: 'Closed / Denied', statuses: ['denied', 'closed'] },
  { id: 'all',                   label: 'All' },
];

function tabCount(leads: EnrollmentLead[], tab: (typeof TABS)[number]): number {
  if (!tab.statuses) return leads.length;
  return leads.filter(l => tab.statuses!.includes(l.status)).length;
}

function filterLeads(leads: EnrollmentLead[], tabId: TabId, search: string): EnrollmentLead[] {
  const tab = TABS.find(t => t.id === tabId)!;
  let result = tab.statuses
    ? leads.filter(l => tab.statuses!.includes(l.status))
    : [...leads];
  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(l =>
      l.parent_name.toLowerCase().includes(q) ||
      l.parent_email.toLowerCase().includes(q) ||
      (l.student_name?.toLowerCase().includes(q) ?? false)
    );
  }
  return result;
}

// ─── Status display ────────────────────────────────────────────────────────

const STATUS_LABELS: Record<EnrollmentLead['status'], string> = {
  new:                   'New',
  approved:              'Approved',
  appointment_scheduled: 'Scheduled',
  appointment_confirmed: 'Confirmed',
  denied:                'Denied',
  enrolled:              'Enrolled',
  closed:                'Closed',
};

const BADGE_STYLES: Record<EnrollmentLead['status'], string> = {
  new:                   'bg-[#FFF0F0] text-[#A01F23] border border-[rgba(160,31,35,0.2)]',
  approved:              'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]',
  appointment_scheduled: 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]',
  appointment_confirmed: 'bg-[#DCFCE7] text-[#14532D] border border-[#86EFAC]',
  denied:                'bg-[#F1F0EF] text-[#6B6866] border border-[#E8E6E3]',
  enrolled:              'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]',
  closed:                'bg-[#F1F0EF] text-[#6B6866] border border-[#E8E6E3]',
};

const _NOW = Date.now();

function AgingIndicator({ createdAt }: { createdAt: string }) {
  const days = Math.floor((_NOW - new Date(createdAt).getTime()) / 86_400_000);
  const label = days === 0 ? 'today' : days === 1 ? '1d ago' : `${days}d ago`;
  return (
    <span className={`text-xs ${days >= 7 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
      {label}
    </span>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Component ─────────────────────────────────────────────────────────────

export function AdminEnrollmentLeadsTab() {
  const [leads, setLeads] = useState<EnrollmentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('new');
  const [search, setSearch] = useState('');
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [denyTarget, setDenyTarget] = useState<EnrollmentLead | null>(null);
  const [pickDateTarget, setPickDateTarget] = useState<EnrollmentLead | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await getEnrollmentLeads();
      setLeads(data);
      setNotesDraft(Object.fromEntries(data.map(l => [l.lead_id, l.admin_notes ?? ''])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(lead: EnrollmentLead) {
    const fnHeaders = await edgeFunctionUserAuthHeaders();
    if (!fnHeaders) { toast.error('Session expired. Please sign in again.'); return; }
    const { error } = await supabase.functions.invoke('approve-enrollment-lead', {
      body: { leadId: lead.lead_id },
      headers: fnHeaders,
    });
    if (error) { toast.error('Failed to send approval'); return; }
    setLeads(prev => prev.map(l => l.lead_id === lead.lead_id ? { ...l, status: 'approved' as const } : l));
    toast.success('Approval sent');
  }

  async function handleResendBookingLink(lead: EnrollmentLead) {
    const fnHeaders = await edgeFunctionUserAuthHeaders();
    if (!fnHeaders) { toast.error('Session expired. Please sign in again.'); return; }
    const { error } = await supabase.functions.invoke('resend-booking-link', {
      body: { leadId: lead.lead_id },
      headers: fnHeaders,
    });
    if (error) { toast.error('Failed to resend booking link'); return; }
    toast.success('Booking link resent');
  }

  async function handleDenyConfirm(leadId: string, message: string) {
    const fnHeaders = await edgeFunctionUserAuthHeaders();
    if (!fnHeaders) { toast.error('Session expired. Please sign in again.'); return; }
    const { error } = await supabase.functions.invoke('deny-enrollment-lead', {
      body: { leadId, message },
      headers: fnHeaders,
    });
    if (error) { toast.error('Failed to send denial'); return; }
    setLeads(prev => prev.map(l => l.lead_id === leadId ? { ...l, status: 'denied' as const } : l));
    setDenyTarget(null);
  }

  async function handleBookingConfirm(leadId: string, slotId: string, appointmentDate: string) {
    const fnHeaders = await edgeFunctionUserAuthHeaders();
    if (!fnHeaders) { toast.error('Session expired. Please sign in again.'); return; }
    const { data, error } = await supabase.functions.invoke('admin-book-appointment', {
      body: { leadId, slotId, appointmentDate },
      headers: fnHeaders,
    });
    if (error || !data) { toast.error('Failed to book appointment'); return; }
    setLeads(prev => prev.map(l => l.lead_id === leadId
      ? { ...l, status: data.status, appointment_date: appointmentDate } : l));
    setPickDateTarget(null);
    toast.success(`Appointment booked for ${appointmentDate}`);
  }

  async function handleStatusChange(leadId: string, status: EnrollmentLead['status']) {
    setUpdatingId(leadId);
    try {
      await updateLeadStatus(leadId, status);
      setLeads(prev => prev.map(l => l.lead_id === leadId ? { ...l, status } : l));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleNotesSave(leadId: string) {
    try {
      await updateLeadAdminNotes(leadId, notesDraft[leadId] ?? '');
    } catch {
      // silent — notes are best-effort
    }
  }

  const visibleLeads = filterLeads(leads, activeTab, search);
  const newCount = leads.filter(l => l.status === 'new').length;
  const approvedCount = leads.filter(l => l.status === 'approved').length;
  const scheduledCount = leads.filter(l => l.status === 'appointment_scheduled').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-3" />
        Loading leads…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Enrollment Leads</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {newCount > 0 && <span className="text-primary font-medium">{newCount} new · </span>}
            {approvedCount > 0 && <span>{approvedCount} approved · </span>}
            {scheduledCount > 0 && <span>{scheduledCount} scheduled · </span>}
            <span>{leads.length} total</span>
          </p>
        </div>
        <Button onClick={() => setShowNewLeadModal(true)} variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          New Lead
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md px-4 py-2">{error}</div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(tab => {
            const count = tabCount(leads, tab);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearch(''); }}
                className={`px-4 py-2.5 text-sm whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary font-semibold -mb-px'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or student…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {visibleLeads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {search.trim() ? 'No leads match your search.' : 'No leads in this status.'}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleLeads.map(lead => (
            <div
              key={lead.lead_id}
              className={`bg-card rounded-lg border overflow-hidden ${
                lead.status === 'new' ? 'border-primary/25' : 'border-border'
              }`}
            >
              <div className="p-4 space-y-3">

                {/* Row 1: name + aging + badge */}
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-base">{lead.parent_name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {activeTab === 'new' && <AgingIndicator createdAt={lead.created_at} />}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE_STYLES[lead.status]}`}>
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </div>
                </div>

                {/* Row 2: contact info */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <a
                    href={`mailto:${lead.parent_email}`}
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {lead.parent_email}
                  </a>
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {lead.phone}
                    </a>
                  )}
                  {lead.student_name && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="w-3.5 h-3.5" />
                      {lead.student_name}{lead.student_age ? `, age ${lead.student_age}` : ''}
                    </span>
                  )}
                </div>

                {/* Appointment date (scheduled / confirmed only) */}
                {(lead.status === 'appointment_scheduled' || lead.status === 'appointment_confirmed') && lead.appointment_date && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Appointment: {new Date(lead.appointment_date + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                    })}
                    {lead.appointment_time && ` at ${new Date('1970-01-01T' + lead.appointment_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                  </p>
                )}

                {/* Message */}
                {lead.message && (
                  <div className="text-sm text-muted-foreground bg-muted/40 rounded-md px-3 py-2 leading-relaxed border-l-2 border-primary/20">
                    {lead.message}
                  </div>
                )}

                {/* Approval timestamp */}
                {lead.approval_email_sent_at && (
                  <p className="text-xs text-muted-foreground">
                    Invite sent {formatDate(lead.approval_email_sent_at)}
                  </p>
                )}

                {/* Admin notes */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Admin notes
                  </p>
                  <textarea
                    value={notesDraft[lead.lead_id] ?? ''}
                    onChange={e => setNotesDraft(d => ({ ...d, [lead.lead_id]: e.target.value }))}
                    onBlur={() => handleNotesSave(lead.lead_id)}
                    rows={2}
                    placeholder="Add internal notes (only visible to admins)…"
                    className="w-full text-sm px-3 py-2 border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/60"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {lead.status === 'new' && (
                    <>
                      <Button size="sm" onClick={() => handleApprove(lead)}>
                        Approve &amp; Send Invite
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/40 hover:bg-destructive/5"
                        onClick={() => setDenyTarget(lead)}
                      >
                        Deny
                      </Button>
                    </>
                  )}
                  {lead.status === 'approved' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleResendBookingLink(lead)}>
                        Resend Booking Link
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPickDateTarget(lead)}>
                        Pick Date for Them
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/40 hover:bg-destructive/5"
                        onClick={() => setDenyTarget(lead)}
                      >
                        Deny
                      </Button>
                    </>
                  )}
                  {(lead.status === 'appointment_scheduled' || lead.status === 'appointment_confirmed') && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleResendBookingLink(lead)}>
                        Resend Booking Link
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPickDateTarget(lead)}>
                        Pick New Date
                      </Button>
                    </>
                  )}
                  {(lead.status === 'enrolled' || lead.status === 'closed') && (
                    <Select
                      value={lead.status}
                      onValueChange={val => handleStatusChange(lead.lead_id, val as EnrollmentLead['status'])}
                      disabled={updatingId === lead.lead_id}
                    >
                      <SelectTrigger className="w-40 h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enrolled">Enrolled</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {denyTarget && (
        <DenyModal lead={denyTarget} onConfirm={handleDenyConfirm} onCancel={() => setDenyTarget(null)} />
      )}
      {pickDateTarget && (
        <PickDateModal lead={pickDateTarget} onConfirm={handleBookingConfirm} onCancel={() => setPickDateTarget(null)} />
      )}
      {showNewLeadModal && (
        <NewLeadModal
          onSuccess={lead => {
            setLeads(prev => [lead, ...prev]);
            setNotesDraft(d => ({ ...d, [lead.lead_id]: lead.admin_notes ?? '' }));
            setShowNewLeadModal(false);
          }}
          onCancel={() => setShowNewLeadModal(false)}
        />
      )}
    </div>
  );
}
