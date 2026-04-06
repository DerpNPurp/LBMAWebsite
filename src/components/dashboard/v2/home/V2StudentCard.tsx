import { useState } from 'react';
import { Card, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Avatar, AvatarFallback } from '../../../ui/avatar';
import { Trophy, AlertCircle, ChevronRight } from 'lucide-react';
import { V2BeltProgressBar } from '../shared/V2BeltProgressBar';
import { V2AbsenceSheet } from './V2AbsenceSheet';

type V2StudentCardProps = {
  studentId: string;
  firstName: string;
  lastName: string;
  age: number | null;
  beltLevel: string;
  status: 'active' | 'inactive';
  userId: string;
  onViewFeedback: () => void;
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export function V2StudentCard({
  firstName,
  lastName,
  age,
  beltLevel,
  status,
  userId,
  onViewFeedback,
}: V2StudentCardProps) {
  const [absenceOpen, setAbsenceOpen] = useState(false);

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {getInitials(firstName, lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg text-foreground leading-tight">
                  {firstName} {lastName}
                </h3>
                {status === 'inactive' && (
                  <Badge variant="secondary" className="text-xs">Inactive</Badge>
                )}
              </div>
              {age !== null && (
                <p className="text-sm text-muted-foreground mt-0.5">{age} years old</p>
              )}
              <div className="flex items-center gap-1.5 mt-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">{beltLevel || 'No belt yet'}</span>
              </div>
            </div>
          </div>

          {/* Belt progress bar */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Belt Progress</p>
            <V2BeltProgressBar beltLevel={beltLevel} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-sm h-10"
              onClick={() => setAbsenceOpen(true)}
            >
              <AlertCircle className="w-4 h-4 mr-1.5" />
              Report Absence
            </Button>
            <Button
              size="sm"
              className="flex-1 text-sm h-10"
              onClick={onViewFeedback}
            >
              View Feedback
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <V2AbsenceSheet
        open={absenceOpen}
        onOpenChange={setAbsenceOpen}
        studentName={`${firstName} ${lastName}`}
        userId={userId}
      />
    </>
  );
}
