import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Avatar, AvatarFallback } from '../../../ui/avatar';
import { Calendar, User, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../ui/collapsible';
import { getFamilyByOwner, getStudentsByFamily, getStudentFeedbackByFamily } from '../../../../lib/supabase/queries';
import type { User as AppUser, Student, StudentFeedback } from '../../../../lib/types';
import { V2PageHeader } from '../shared/V2PageHeader';
import { V2SkeletonList } from '../shared/V2SkeletonList';
import { V2EmptyState } from '../shared/V2EmptyState';
import { ClipboardList } from 'lucide-react';

type FeedbackRow = StudentFeedback & { profiles: { display_name: string | null } | null };

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

const BELT_COLORS: Record<string, string> = {
  'white belt': 'bg-gray-100 text-gray-700 border-gray-300',
  'yellow belt': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'orange belt': 'bg-orange-100 text-orange-800 border-orange-300',
  'purple belt': 'bg-purple-100 text-purple-800 border-purple-300',
  'blue belt': 'bg-blue-100 text-blue-800 border-blue-300',
  'green belt': 'bg-green-100 text-green-800 border-green-300',
  'brown belt': 'bg-amber-100 text-amber-900 border-amber-300',
  'red belt': 'bg-red-100 text-red-800 border-red-300',
  'black belt': 'bg-gray-900 text-white border-gray-700',
};

function getBeltClass(level: string) {
  return BELT_COLORS[level?.toLowerCase()] || 'bg-muted text-muted-foreground border-border';
}

export function V2FeedbackTab({ user }: { user: NonNullable<AppUser> }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const family = await getFamilyByOwner(user.id);
        if (!family) { setLoading(false); return; }
        const [studentsData, feedbackData] = await Promise.all([
          getStudentsByFamily(family.family_id),
          getStudentFeedbackByFamily(family.family_id),
        ]);
        setStudents(studentsData);
        setFeedback(feedbackData);
        // Default: expand first student if only one
        if (studentsData.length === 1) {
          setExpanded({ [studentsData[0].student_id]: true });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feedback');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.id]);

  const grouped = students.map((s) => ({
    student: s,
    items: feedback.filter((f) => f.student_id === s.student_id).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
  }));

  if (loading) return <V2SkeletonList rows={5} showAvatar />;

  if (error) return (
    <div className="text-center py-12 text-destructive">
      <p>{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <V2PageHeader
        title="Instructor Feedback"
        description="Progress notes and comments from your child's instructors."
      />

      {students.length === 0 ? (
        <V2EmptyState
          icon={ClipboardList}
          heading="No students added yet"
          body="Add your children to your profile to see feedback from instructors here."
        />
      ) : (
        <div className="space-y-4">
          {grouped.map(({ student, items }) => {
            const isOpen = expanded[student.student_id] ?? false;
            const beltClass = getBeltClass(student.belt_level || '');

            return (
              <Card key={student.student_id}>
                <Collapsible
                  open={isOpen}
                  onOpenChange={(open) =>
                    setExpanded((prev) => ({ ...prev, [student.student_id]: open }))
                  }
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer select-none hover:bg-muted/30 transition-colors rounded-t-xl">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
                              {getInitials(`${student.first_name} ${student.last_name}`)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-lg text-foreground">
                              {student.first_name} {student.last_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Trophy className="w-4 h-4 text-amber-500" />
                              <Badge className={`text-xs border ${beltClass}`}>
                                {student.belt_level || 'No belt'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {items.length} {items.length === 1 ? 'note' : 'notes'}
                              </span>
                            </div>
                          </div>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-3">
                      {items.length === 0 ? (
                        <div className="py-8 text-center">
                          <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                          <p className="text-muted-foreground text-sm">
                            No feedback yet — your instructor will share notes here after class events.
                          </p>
                        </div>
                      ) : (
                        items.map((item) => (
                          <div
                            key={item.feedback_id}
                            className="p-4 rounded-xl bg-muted/40 border border-border"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="font-semibold text-foreground text-sm">{item.event_title}</p>
                              {item.event_date && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {formatDate(item.event_date)}
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed">{item.body}</p>
                            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                              <User className="w-3.5 h-3.5" />
                              <span>{item.profiles?.display_name || 'Instructor'}</span>
                              <span>·</span>
                              <span>{formatDate(item.created_at)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
