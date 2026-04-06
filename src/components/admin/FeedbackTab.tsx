import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Plus, Calendar, Trash2, MessageSquare, User, CheckCircle2, Clock } from 'lucide-react';
import { getAllStudentFeedback } from '../../lib/supabase/queries';
import { createStudentFeedback, deleteStudentFeedback } from '../../lib/supabase/mutations';
import { supabase } from '../../lib/supabase/client';
import type { Student, StudentFeedback } from '../../lib/types';

type FeedbackRow = StudentFeedback & { profiles: { display_name: string | null } | null };

type EventGroup = {
  eventTitle: string;
  eventDate: string | null;
  entries: FeedbackRow[];
};

export function FeedbackTab() {
  const [students, setStudents] = useState<Student[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [feedbackBody, setFeedbackBody] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [{ data: studentsData, error: studentsError }, feedbackData] = await Promise.all([
        supabase.from('students').select('*').order('first_name', { ascending: true }),
        getAllStudentFeedback(),
      ]);

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);
      setFeedback(feedbackData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group feedback by event_title
  const eventGroups: EventGroup[] = Object.values(
    feedback.reduce<Record<string, EventGroup>>((acc, row) => {
      if (!acc[row.event_title]) {
        acc[row.event_title] = {
          eventTitle: row.event_title,
          eventDate: row.event_date,
          entries: [],
        };
      }
      acc[row.event_title].entries.push(row);
      return acc;
    }, {})
  ).sort((a, b) => {
    const aDate = a.entries[0]?.created_at ?? '';
    const bDate = b.entries[0]?.created_at ?? '';
    return bDate.localeCompare(aDate);
  });

  const selectedGroup = eventGroups.find((g) => g.eventTitle === selectedEvent) ?? null;

  const studentsWithoutFeedbackInEvent = students.filter(
    (s) => !selectedGroup?.entries.some((e) => e.student_id === s.student_id)
  );

  async function handleSaveFeedback() {
    if (!eventTitle.trim() || !selectedStudentId || !feedbackBody.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newRow = await createStudentFeedback({
        student_id: selectedStudentId,
        author_user_id: user.id,
        event_title: eventTitle.trim(),
        event_date: eventDate || null,
        body: feedbackBody.trim(),
      });

      // Optimistically update local state
      setFeedback((prev) => [{ ...newRow, profiles: null }, ...prev]);

      // Select the event we just created/added to
      setSelectedEvent(newRow.event_title);
      setShowCreateForm(false);
      setSelectedStudentId('');
      setFeedbackBody('');
      // Keep eventTitle/eventDate so admin can quickly add more students to the same event
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save feedback');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteFeedback(feedbackId: string) {
    try {
      await deleteStudentFeedback(feedbackId);
      setFeedback((prev) => prev.filter((f) => f.feedback_id !== feedbackId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete feedback');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
        Loading feedback...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold">Student Feedback</h2>
          <p className="text-muted-foreground text-lg">Create evaluations and provide feedback to students</p>
        </div>
        <Button onClick={() => { setShowCreateForm(true); setSelectedEvent(null); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Feedback
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md px-4 py-2">{error}</div>
      )}

      {/* Add Feedback Form */}
      {showCreateForm && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Add Student Feedback</CardTitle>
            <CardDescription>Enter evaluation details and feedback for a student</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-title">Evaluation / Event Title</Label>
                <Input
                  id="event-title"
                  placeholder="e.g., Spring Belt Testing"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-date">Event Date (optional)</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-select">Student</Label>
              <select
                id="student-select"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                <option value="">Choose a student...</option>
                {students.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.first_name} {s.last_name}{s.belt_level ? ` — ${s.belt_level}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-body">Feedback</Label>
              <Textarea
                id="feedback-body"
                placeholder="Enter detailed feedback for this student..."
                rows={4}
                value={feedbackBody}
                onChange={(e) => setFeedbackBody(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveFeedback}
                disabled={saving || !eventTitle.trim() || !selectedStudentId || !feedbackBody.trim()}
              >
                {saving ? 'Saving...' : 'Save Feedback'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setEventTitle('');
                  setEventDate('');
                  setSelectedStudentId('');
                  setFeedbackBody('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Event list */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Evaluations</CardTitle>
            <CardDescription>{eventGroups.length} total</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventGroups.map((group) => (
              <div
                key={group.eventTitle}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedEvent === group.eventTitle
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-secondary/50'
                }`}
                onClick={() => setSelectedEvent(group.eventTitle)}
              >
                <div className="space-y-2">
                  <h4 className="font-medium leading-tight">{group.eventTitle}</h4>
                  {group.eventDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {formatDate(group.eventDate)}
                    </div>
                  )}
                  <Badge variant="secondary" className="gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
                  </Badge>
                </div>
              </div>
            ))}
            {eventGroups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No evaluations yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedGroup ? selectedGroup.eventTitle : 'Select an evaluation'}</CardTitle>
                <CardDescription>
                  {selectedGroup
                    ? `${selectedGroup.entries.length} student${selectedGroup.entries.length !== 1 ? 's' : ''} reviewed`
                    : 'Choose an evaluation to view feedback'}
                </CardDescription>
              </div>
              {selectedGroup && studentsWithoutFeedbackInEvent.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEventTitle(selectedGroup.eventTitle);
                    setEventDate(selectedGroup.eventDate ?? '');
                    setShowCreateForm(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedGroup ? (
              selectedGroup.entries.map((entry) => {
                const student = students.find((s) => s.student_id === entry.student_id);
                return (
                  <Card key={entry.feedback_id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium">
                                {student ? `${student.first_name} ${student.last_name}` : 'Unknown Student'}
                              </h4>
                              {student?.belt_level && (
                                <p className="text-xs text-muted-foreground">{student.belt_level}</p>
                              )}
                              <p className="text-sm text-muted-foreground">{formatDate(entry.created_at)}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteFeedback(entry.feedback_id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm leading-relaxed pl-13">{entry.body}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Select an evaluation from the list to view feedback</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
