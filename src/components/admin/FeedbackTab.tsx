import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  Plus, 
  Calendar, 
  Edit, 
  Trash2, 
  MessageSquare,
  User,
  CheckCircle2,
  Clock
} from 'lucide-react';

type Test = {
  id: string;
  title: string;
  date: string;
  createdAt: string;
  feedbackCount: number;
};

type StudentFeedback = {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  feedback: string;
  createdAt: string;
};

type Student = {
  id: string;
  name: string;
  age: number;
  beltLevel: string;
  parentName: string;
};

// Mock data
const mockStudents: Student[] = [
  { id: '1', name: 'Emma Johnson', age: 8, beltLevel: 'Yellow Belt', parentName: 'Sarah Johnson' },
  { id: '2', name: 'Lucas Johnson', age: 6, beltLevel: 'White Belt', parentName: 'Sarah Johnson' },
  { id: '3', name: 'Sophia Martinez', age: 10, beltLevel: 'Green Belt', parentName: 'Jennifer Martinez' },
  { id: '4', name: 'Noah Torres', age: 7, beltLevel: 'Orange Belt', parentName: 'Michael Torres' },
  { id: '5', name: 'Olivia Chen', age: 9, beltLevel: 'Yellow Belt', parentName: 'Lisa Chen' },
];

const initialTests: Test[] = [
  {
    id: '1',
    title: 'January Belt Testing',
    date: '2026-01-15',
    createdAt: '2026-01-10T10:00:00Z',
    feedbackCount: 5
  },
  {
    id: '2',
    title: 'Mid-Year Progress Review',
    date: '2026-02-10',
    createdAt: '2026-02-05T14:00:00Z',
    feedbackCount: 3
  }
];

const initialFeedback: StudentFeedback[] = [
  {
    id: '1',
    testId: '1',
    studentId: '1',
    studentName: 'Emma Johnson',
    feedback: 'Emma showed excellent technique in her forms. Her focus has improved significantly. Continue working on higher kicks.',
    createdAt: '2026-01-16T10:00:00Z'
  },
  {
    id: '2',
    testId: '1',
    studentId: '2',
    studentName: 'Lucas Johnson',
    feedback: 'Lucas is making great progress! His enthusiasm is wonderful. Keep practicing basic stances at home.',
    createdAt: '2026-01-16T10:15:00Z'
  },
  {
    id: '3',
    testId: '2',
    studentId: '3',
    studentName: 'Sophia Martinez',
    feedback: 'Outstanding performance! Sophia demonstrates leadership qualities and helps younger students. Ready for blue belt testing soon.',
    createdAt: '2026-02-11T09:00:00Z'
  }
];

export function FeedbackTab() {
  const [tests, setTests] = useState<Test[]>(initialTests);
  const [feedbacks, setFeedbacks] = useState<StudentFeedback[]>(initialFeedback);
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  
  // Form states
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestDate, setNewTestDate] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [feedbackText, setFeedbackText] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCreateTest = () => {
    if (!newTestTitle || !newTestDate) return;

    const newTest: Test = {
      id: Date.now().toString(),
      title: newTestTitle,
      date: newTestDate,
      createdAt: new Date().toISOString(),
      feedbackCount: 0
    };

    setTests([newTest, ...tests]);
    setNewTestTitle('');
    setNewTestDate('');
    setShowCreateTest(false);
  };

  const handleAddFeedback = () => {
    if (!selectedTest || !selectedStudent || !feedbackText) return;

    const student = mockStudents.find(s => s.id === selectedStudent);
    if (!student) return;

    const newFeedback: StudentFeedback = {
      id: Date.now().toString(),
      testId: selectedTest.id,
      studentId: selectedStudent,
      studentName: student.name,
      feedback: feedbackText,
      createdAt: new Date().toISOString()
    };

    setFeedbacks([newFeedback, ...feedbacks]);
    
    // Update feedback count
    setTests(tests.map(t => 
      t.id === selectedTest.id 
        ? { ...t, feedbackCount: t.feedbackCount + 1 }
        : t
    ));

    setSelectedStudent('');
    setFeedbackText('');
    setShowFeedbackForm(false);
  };

  const handleDeleteTest = (testId: string) => {
    setTests(tests.filter(t => t.id !== testId));
    setFeedbacks(feedbacks.filter(f => f.testId !== testId));
    if (selectedTest?.id === testId) {
      setSelectedTest(null);
    }
  };

  const handleDeleteFeedback = (feedbackId: string, testId: string) => {
    setFeedbacks(feedbacks.filter(f => f.id !== feedbackId));
    setTests(tests.map(t => 
      t.id === testId 
        ? { ...t, feedbackCount: Math.max(0, t.feedbackCount - 1) }
        : t
    ));
  };

  const getTestFeedbacks = (testId: string) => {
    return feedbacks.filter(f => f.testId === testId);
  };

  const getStudentsWithoutFeedback = (testId: string) => {
    const testFeedbacks = feedbacks.filter(f => f.testId === testId);
    const studentIdsWithFeedback = testFeedbacks.map(f => f.studentId);
    return mockStudents.filter(s => !studentIdsWithFeedback.includes(s.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold">Student Feedback</h2>
          <p className="text-muted-foreground text-lg">
            Create tests and provide feedback to students
          </p>
        </div>
        <Button onClick={() => setShowCreateTest(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Test
        </Button>
      </div>

      {/* Create Test Form */}
      {showCreateTest && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Create New Test</CardTitle>
            <CardDescription>Add a new test or evaluation session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-title">Test Title</Label>
              <Input
                id="test-title"
                placeholder="e.g., March Belt Testing"
                value={newTestTitle}
                onChange={(e) => setNewTestTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-date">Test Date</Label>
              <Input
                id="test-date"
                type="date"
                value={newTestDate}
                onChange={(e) => setNewTestDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateTest}>Create Test</Button>
              <Button variant="outline" onClick={() => setShowCreateTest(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Tests List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Tests & Evaluations</CardTitle>
            <CardDescription>{tests.length} total tests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tests.map((test) => (
              <div
                key={test.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedTest?.id === test.id
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-secondary/50'
                }`}
                onClick={() => setSelectedTest(test)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium leading-tight">{test.title}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTest(test.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {formatDate(test.date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {test.feedbackCount} feedback
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            {tests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tests created yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedTest ? selectedTest.title : 'Select a test'}
                </CardTitle>
                <CardDescription>
                  {selectedTest 
                    ? `Feedback for ${formatDate(selectedTest.date)}`
                    : 'Choose a test to view and manage feedback'}
                </CardDescription>
              </div>
              {selectedTest && (
                <Button onClick={() => setShowFeedbackForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Feedback
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showFeedbackForm && selectedTest && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">Add Student Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-select">Select Student</Label>
                    <select
                      id="student-select"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                    >
                      <option value="">Choose a student...</option>
                      {getStudentsWithoutFeedback(selectedTest.id).map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} - {student.beltLevel} (Parent: {student.parentName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedback-text">Feedback</Label>
                    <Textarea
                      id="feedback-text"
                      placeholder="Enter detailed feedback for this student..."
                      rows={4}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddFeedback}>Save Feedback</Button>
                    <Button variant="outline" onClick={() => {
                      setShowFeedbackForm(false);
                      setSelectedStudent('');
                      setFeedbackText('');
                    }}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedTest && !showFeedbackForm && (
              <div className="space-y-4">
                {getTestFeedbacks(selectedTest.id).map((feedback) => (
                  <Card key={feedback.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium">{feedback.studentName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(feedback.createdAt)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteFeedback(feedback.id, feedback.testId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="pl-13">
                          <p className="text-sm leading-relaxed">{feedback.feedback}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {getTestFeedbacks(selectedTest.id).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No feedback added yet</p>
                    <p className="text-sm mt-1">Click "Add Feedback" to get started</p>
                  </div>
                )}
              </div>
            )}

            {!selectedTest && (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Select a test from the list to view feedback</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
