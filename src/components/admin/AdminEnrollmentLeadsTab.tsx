import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Mail, Phone, User, Calendar, MessageSquare, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase/client';
import { getEnrollmentLeads } from '../../lib/supabase/queries';
import { updateLeadStatus } from '../../lib/supabase/mutations';
import type { EnrollmentLead } from '../../lib/types';
import { DenyModal } from './DenyModal';
import { PickDateModal } from './PickDateModal';
import { NewLeadModal } from './NewLeadModal';

const STATUS_LABELS: Record<EnrollmentLead['status'], string> = {
  new: 'New',
  approved: 'Approved',
  appointment_scheduled: 'Appt. Scheduled',
  appointment_confirmed: 'Confirmed',
  denied: 'Denied',
  enrolled: 'Enrolled',
  closed: 'Closed',
};

const STATUS_COLORS: Record<EnrollmentLead['status'], string> = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  approved: 'bg-amber-100 text-amber-800 border-amber-200',
  appointment_scheduled: 'bg-purple-100 text-purple-800 border-purple-200',
  appointment_confirmed: 'bg-green-100 text-green-800 border-green-200',
  denied: 'bg-red-100 text-red-800 border-red-200',
  enrolled: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function AdminEnrollmentLeadsTab() {
  const [leads, setLeads] = useState<EnrollmentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [denyTarget, setDenyTarget] = useState<EnrollmentLead | null>(null);
  const [pickDateTarget, setPickDateTarget] = useState<EnrollmentLead | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      setLeads(await getEnrollmentLeads());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(lead: EnrollmentLead) {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.functions.invoke('approve-enrollment-lead', {
      body: { leadId: lead.lead_id },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (error) { toast.error('Failed to send approval'); return }
    setLeads(prev => prev.map(l => l.lead_id === lead.lead_id ? { ...l, status: 'approved' as const } : l));
    toast.success('Approval sent');
  }

  async function handleResendBookingLink(lead: EnrollmentLead) {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.functions.invoke('resend-booking-link', {
      body: { leadId: lead.lead_id },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (error) { toast.error('Failed to resend booking link'); return }
    toast.success('Booking link resent');
  }

  async function handleDenyConfirm(leadId: string, message: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.functions.invoke('deny-enrollment-lead', {
      body: { leadId, message },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (error) { toast.error('Failed to send denial'); return }
    setLeads(prev => prev.map(l => l.lead_id === leadId ? { ...l, status: 'denied' as const } : l));
    setDenyTarget(null);
  }

  async function handleBookingConfirm(leadId: string, slotId: string, appointmentDate: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke('admin-book-appointment', {
      body: { leadId, slotId, appointmentDate },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (error || !data) { toast.error('Failed to book appointment'); return }
    setLeads(prev => prev.map(l => l.lead_id === leadId
      ? { ...l, status: data.status, appointment_date: appointmentDate } : l));
    setPickDateTarget(null);
    toast.success(`Appointment booked for ${appointmentDate}`);
  }

  async function handleStatusChange(leadId: string, status: EnrollmentLead['status']) {
    setUpdatingId(leadId);
    try {
      await updateLeadStatus(leadId, status);
      setLeads((prev) =>
        prev.map((l) => (l.lead_id === leadId ? { ...l, status } : l))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  const newCount = leads.filter((l) => l.status === 'new').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-3" />
        Loading leads...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold flex items-center gap-3">
            Enrollment Leads
            {newCount > 0 && (
              <Badge className="text-sm px-2 py-0.5 bg-blue-600 text-white">
                {newCount} new
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground text-lg">
            Inquiries submitted from the public contact form
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

      {leads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Mail className="w-12 h-12 mb-3 opacity-40" />
            <p className="font-medium">No leads yet</p>
            <p className="text-sm mt-1">Submissions from the contact form will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <Card key={lead.lead_id} className={lead.status === 'new' ? 'border-blue-200 shadow-sm' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-3">
                      {lead.parent_name}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[lead.status]}`}>
                        {STATUS_LABELS[lead.status]}
                      </span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Submitted {formatDate(lead.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Status updater for enrolled/closed */}
                    {(lead.status === 'enrolled' || lead.status === 'closed') && (
                      <Select
                        value={lead.status}
                        onValueChange={(val) => handleStatusChange(lead.lead_id, val as EnrollmentLead['status'])}
                        disabled={updatingId === lead.lead_id}
                      >
                        <SelectTrigger className="w-48 h-9 text-sm">
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
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Contact info */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <a
                    href={`mailto:${lead.parent_email}`}
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Mail className="w-4 h-4" />
                    {lead.parent_email}
                  </a>
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <Phone className="w-4 h-4" />
                      {lead.phone}
                    </a>
                  )}
                  {lead.student_name && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="w-4 h-4" />
                      {lead.student_name}{lead.student_age ? `, age ${lead.student_age}` : ''}
                    </span>
                  )}
                </div>

                {/* Appointment date for scheduled/confirmed leads */}
                {(lead.status === 'appointment_scheduled' || lead.status === 'appointment_confirmed') && lead.appointment_date && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Appointment: {new Date(lead.appointment_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    {lead.appointment_time && ` at ${new Date('1970-01-01T' + lead.appointment_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                  </p>
                )}

                {/* Message */}
                {lead.message && (
                  <div className="flex gap-2 pt-1">
                    <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground leading-relaxed">{lead.message}</p>
                  </div>
                )}

                {/* Approval timestamp */}
                {lead.approval_email_sent_at && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Invite sent {formatDate(lead.approval_email_sent_at)}
                  </p>
                )}

                {/* Action buttons per status */}
                {lead.status === 'new' && (
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={() => handleApprove(lead)}>Approve & Send Invite</Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => setDenyTarget(lead)}>Deny</Button>
                  </div>
                )}
                {lead.status === 'approved' && (
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => handleResendBookingLink(lead)}>Resend Booking Link</Button>
                    <Button size="sm" variant="outline" onClick={() => setPickDateTarget(lead)}>Pick Date for Them</Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => setDenyTarget(lead)}>Deny</Button>
                  </div>
                )}
                {(lead.status === 'appointment_scheduled' || lead.status === 'appointment_confirmed') && (
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => handleResendBookingLink(lead)}>Resend Booking Link</Button>
                    <Button size="sm" variant="outline" onClick={() => setPickDateTarget(lead)}>Pick New Date</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {denyTarget && (
        <DenyModal
          lead={denyTarget}
          onConfirm={handleDenyConfirm}
          onCancel={() => setDenyTarget(null)}
        />
      )}
      {pickDateTarget && (
        <PickDateModal
          lead={pickDateTarget}
          onConfirm={handleBookingConfirm}
          onCancel={() => setPickDateTarget(null)}
        />
      )}
      {showNewLeadModal && (
        <NewLeadModal
          onSuccess={(lead) => { setLeads(prev => [lead, ...prev]); setShowNewLeadModal(false); }}
          onCancel={() => setShowNewLeadModal(false)}
        />
      )}
    </div>
  );
}
