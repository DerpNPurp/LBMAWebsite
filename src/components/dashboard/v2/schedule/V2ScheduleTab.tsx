import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { CalendarDays, Clock, User } from 'lucide-react';
import { V2PageHeader } from '../shared/V2PageHeader';

type ClassEntry = {
  day: string;
  time: string;
  className: string;
  ageGroup: string;
  instructor: string;
  durationMins: number;
};

const SCHEDULE: ClassEntry[] = [
  { day: 'Monday', time: '4:00 PM', className: 'Little Dragons', ageGroup: 'Ages 4–6', instructor: 'Master Lee', durationMins: 45 },
  { day: 'Monday', time: '5:00 PM', className: 'Junior Karate', ageGroup: 'Ages 7–12', instructor: 'Sensei Rivera', durationMins: 60 },
  { day: 'Monday', time: '6:30 PM', className: 'Adult Martial Arts', ageGroup: '13+', instructor: 'Master Lee', durationMins: 60 },
  { day: 'Tuesday', time: '4:00 PM', className: 'Little Dragons', ageGroup: 'Ages 4–6', instructor: 'Sensei Kim', durationMins: 45 },
  { day: 'Tuesday', time: '5:00 PM', className: 'Junior Advanced', ageGroup: 'Ages 7–12', instructor: 'Master Lee', durationMins: 60 },
  { day: 'Wednesday', time: '4:00 PM', className: 'Little Dragons', ageGroup: 'Ages 4–6', instructor: 'Sensei Rivera', durationMins: 45 },
  { day: 'Wednesday', time: '5:00 PM', className: 'Junior Karate', ageGroup: 'Ages 7–12', instructor: 'Sensei Kim', durationMins: 60 },
  { day: 'Wednesday', time: '6:30 PM', className: 'Adult Martial Arts', ageGroup: '13+', instructor: 'Master Lee', durationMins: 60 },
  { day: 'Thursday', time: '4:00 PM', className: 'Little Dragons', ageGroup: 'Ages 4–6', instructor: 'Sensei Kim', durationMins: 45 },
  { day: 'Thursday', time: '5:00 PM', className: 'Junior Karate', ageGroup: 'Ages 7–12', instructor: 'Sensei Rivera', durationMins: 60 },
  { day: 'Friday', time: '4:00 PM', className: 'Junior Karate', ageGroup: 'Ages 7–12', instructor: 'Master Lee', durationMins: 60 },
  { day: 'Friday', time: '5:30 PM', className: 'Adult Martial Arts', ageGroup: '13+', instructor: 'Sensei Rivera', durationMins: 60 },
  { day: 'Saturday', time: '9:00 AM', className: 'Little Dragons', ageGroup: 'Ages 4–6', instructor: 'Sensei Kim', durationMins: 45 },
  { day: 'Saturday', time: '10:00 AM', className: 'Junior Karate', ageGroup: 'Ages 7–12', instructor: 'Master Lee', durationMins: 60 },
  { day: 'Saturday', time: '11:15 AM', className: 'Adult Martial Arts', ageGroup: '13+', instructor: 'Sensei Rivera', durationMins: 60 },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AGE_GROUP_COLORS: Record<string, string> = {
  'Ages 4–6': 'bg-pink-100 text-pink-800 border-pink-200',
  'Ages 7–12': 'bg-blue-100 text-blue-800 border-blue-200',
  '13+': 'bg-purple-100 text-purple-800 border-purple-200',
};

function ClassCard({ entry }: { entry: ClassEntry }) {
  const badgeClass = AGE_GROUP_COLORS[entry.ageGroup] || 'bg-muted text-muted-foreground';
  return (
    <div className="p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="font-semibold text-foreground text-sm leading-snug">{entry.className}</p>
        <Badge className={`text-xs border shrink-0 ${badgeClass}`}>{entry.ageGroup}</Badge>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Clock className="w-3.5 h-3.5" />
        {entry.time} · {entry.durationMins} min
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <User className="w-3.5 h-3.5" />
        {entry.instructor}
      </div>
    </div>
  );
}

export function V2ScheduleTab() {
  const byDay = DAYS.reduce<Record<string, ClassEntry[]>>((acc, day) => {
    acc[day] = SCHEDULE.filter((e) => e.day === day);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <V2PageHeader
        title="Class Schedule"
        description="Weekly schedule for all classes. Contact us to confirm any changes."
      />

      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
        <strong>Note:</strong> This schedule is for reference. Always confirm with staff for holiday or special event adjustments.
      </div>

      {/* Desktop: grid view */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-3 gap-4">
        {DAYS.map((day) => (
          <Card key={day}>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                {day}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {byDay[day].length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No classes</p>
              ) : (
                byDay[day].map((entry, i) => <ClassCard key={i} entry={entry} />)
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile: stacked list */}
      <div className="md:hidden space-y-6">
        {DAYS.map((day) => (
          <div key={day}>
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg text-foreground">{day}</h2>
            </div>
            {byDay[day].length === 0 ? (
              <p className="text-sm text-muted-foreground pl-7">No classes scheduled</p>
            ) : (
              <div className="space-y-2 pl-7">
                {byDay[day].map((entry, i) => <ClassCard key={i} entry={entry} />)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
