import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  MessageSquare, 
  Calendar, 
  User,
  Award,
  Clock
} from 'lucide-react';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'family';
  displayName: string;
};

type StudentFeedback = {
  id: string;
  testTitle: string;
  testDate: string;
  studentId: string; // Links to which student this feedback is for
  studentName: string;
  studentBeltLevel: string;
  feedback: string;
  createdAt: string;
  instructorName: string;
};

type Student = {
  id: string;
  name: string;
  age: number;
  beltLevel: string;
  parentId: string; // Links to which parent account owns this child
};

// Mock students - Each student belongs to a specific parent account
// In production, this would be filtered by the logged-in user's ID
const allStudents: Student[] = [
  { id: '1', name: 'Emma Johnson', age: 8, beltLevel: 'Yellow Belt', parentId: '1' },
  { id: '2', name: 'Lucas Johnson', age: 6, beltLevel: 'White Belt', parentId: '1' },
  { id: '3', name: 'Sophia Martinez', age: 10, beltLevel: 'Green Belt', parentId: '2' },
  { id: '4', name: 'Noah Torres', age: 7, beltLevel: 'Orange Belt', parentId: '3' },
];

// Mock feedback for ALL students across all families
const allFeedback: StudentFeedback[] = [
  {
    id: '1',
    testTitle: 'January Belt Testing',
    testDate: '2026-01-15',
    studentId: '1', // Emma Johnson
    studentName: 'Emma Johnson',
    studentBeltLevel: 'Yellow Belt',
    feedback: 'Emma showed excellent technique in her forms. Her focus has improved significantly. Continue working on higher kicks.',
    createdAt: '2026-01-16T10:00:00Z',
    instructorName: 'Master Reyes'
  },
  {
    id: '2',
    testTitle: 'January Belt Testing',
    testDate: '2026-01-15',
    studentId: '2', // Lucas Johnson
    studentName: 'Lucas Johnson',
    studentBeltLevel: 'White Belt',
    feedback: 'Lucas is making great progress! His enthusiasm is wonderful. Keep practicing basic stances at home.',
    createdAt: '2026-01-16T10:15:00Z',
    instructorName: 'Master Reyes'
  },
  {
    id: '3',
    testTitle: 'December Progress Review',
    testDate: '2025-12-10',
    studentId: '1', // Emma Johnson
    studentName: 'Emma Johnson',
    studentBeltLevel: 'Yellow Belt',
    feedback: 'Emma demonstrates strong commitment and discipline. Her kicks are improving with each class. Great job!',
    createdAt: '2025-12-11T14:00:00Z',
    instructorName: 'Instructor Sarah'
  },
  {
    id: '4',
    testTitle: 'January Belt Testing',
    testDate: '2026-01-15',
    studentId: '3', // Sophia Martinez - DIFFERENT PARENT, should NOT be visible to Sarah Johnson
    studentName: 'Sophia Martinez',
    studentBeltLevel: 'Green Belt',
    feedback: 'Outstanding performance! Sophia demonstrates leadership qualities and helps younger students. Ready for blue belt testing soon.',
    createdAt: '2026-01-16T10:30:00Z',
    instructorName: 'Master Reyes'
  }
];

type FeedbackTabProps = {
  user?: User; // Make user optional with default
};

export function FeedbackTab({ user }: FeedbackTabProps) {
  // Filter students to only show those belonging to this parent
  // In production, user.id would match the parentId
  const myStudents = allStudents.filter(student => student.parentId === (user?.id || '1'));
  
  // Filter feedback to only show feedback for this parent's children
  const myStudentIds = myStudents.map(s => s.id);
  const myFeedback = allFeedback.filter(feedback => myStudentIds.includes(feedback.studentId));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const groupedFeedback = myStudents.map(student => ({
    student,
    feedback: myFeedback.filter(f => f.studentId === student.id)
  }));

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
        {groupedFeedback.map(({ student, feedback }) => (
          <Card key={student.id}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {getInitials(student.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-3">
                    {student.name}
                    <Badge variant="secondary" className="gap-1">
                      <Award className="w-3 h-3" />
                      {student.beltLevel}
                    </Badge>
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedback.length > 0 ? (
                feedback.map((item) => (
                  <Card key={item.id} className="bg-secondary/30">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium">{item.testTitle}</h4>
                            <span className="text-muted-foreground">•</span>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {formatDate(item.testDate)}
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed">{item.feedback}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                            <User className="w-4 h-4" />
                            <span>{item.instructorName}</span>
                            <span>•</span>
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No feedback yet for {student.name}</p>
                  <p className="text-sm mt-1">Feedback will appear here after evaluations</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Feedback
          </CardTitle>
          <CardDescription>Latest instructor feedback across all your children</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {myFeedback.length > 0 ? (
            myFeedback.slice(0, 5).map((item) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback className="text-sm bg-primary/10 text-primary">
                    {getInitials(item.studentName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{item.studentName}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.studentBeltLevel}
                    </Badge>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{item.testTitle}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.feedback}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>{item.instructorName}</span>
                    <span>•</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No feedback available yet</p>
              <p className="text-sm mt-1">Feedback will appear here after evaluations</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}