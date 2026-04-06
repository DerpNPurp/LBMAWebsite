import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { MessageSquare, Calendar, User, Award, Clock } from 'lucide-react';
import { getFamilyByOwner, getStudentsByFamily, getStudentFeedbackByFamily } from '../../lib/supabase/queries';
import type { User as AppUser, Student, StudentFeedback } from '../../lib/types';

type FeedbackTabProps = {
  user: NonNullable<AppUser>;
};

type FeedbackRow = StudentFeedback & { profiles: { display_name: string | null } | null };

export function FeedbackTab({ user }: FeedbackTabProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const family = await getFamilyByOwner(user.id);
        if (!family) {
          setLoading(false);
          return;
        }
        const [studentsData, feedbackData] = await Promise.all([
          getStudentsByFamily(family.family_id),
          getStudentFeedbackByFamily(family.family_id),
        ]);
        setStudents(studentsData);
        setFeedback(feedbackData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feedback');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase();

  const groupedFeedback = students.map((student) => ({
    student,
    feedback: feedback.filter((f) => f.student_id === student.student_id),
  }));

  const recentFeedback = [...feedback].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
        Loading feedback...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-bold">Instructor Feedback</h2>
        <p className="text-muted-foreground text-lg">
          Review feedback and progress notes from instructors
        </p>
      </div>

      {/* Feedback by Student */}
      <div className="space-y-6">
        {groupedFeedback.map(({ student, feedback: studentFeedback }) => (
          <Card key={student.student_id}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {getInitials(`${student.first_name} ${student.last_name}`)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-3">
                    {student.first_name} {student.last_name}
                    {student.belt_level && (
                      <Badge variant="secondary" className="gap-1">
                        <Award className="w-3 h-3" />
                        {student.belt_level}
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {studentFeedback.length > 0 ? (
                studentFeedback.map((item) => (
                  <Card key={item.feedback_id} className="bg-secondary/30">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium">{item.event_title}</h4>
                            {item.event_date && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(item.event_date)}
                                </div>
                              </>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed">{item.body}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                            <User className="w-4 h-4" />
                            <span>{item.profiles?.display_name ?? 'Instructor'}</span>
                            <span>•</span>
                            <span>{formatDate(item.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No feedback yet for {student.first_name}</p>
                  <p className="text-sm mt-1">
                    Your instructor will post notes here after testing events
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {students.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No students found on your account</p>
          </div>
        )}
      </div>

      {/* Recent Feedback */}
      {recentFeedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Feedback
            </CardTitle>
            <CardDescription>Latest instructor feedback across all your children</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentFeedback.slice(0, 5).map((item) => {
              const student = students.find((s) => s.student_id === item.student_id);
              const studentName = student
                ? `${student.first_name} ${student.last_name}`
                : 'Student';
              return (
                <div key={item.feedback_id} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="text-sm bg-primary/10 text-primary">
                      {getInitials(studentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{studentName}</span>
                      {student?.belt_level && (
                        <Badge variant="outline" className="text-xs">
                          {student.belt_level}
                        </Badge>
                      )}
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{item.event_title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{item.profiles?.display_name ?? 'Instructor'}</span>
                      <span>•</span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
