import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../../ui/sheet';
import { Button } from '../../../ui/button';
import { Textarea } from '../../../ui/textarea';
import { Label } from '../../../ui/label';
import { Input } from '../../../ui/input';
import { createMessage } from '../../../../lib/supabase/mutations';
import { getGlobalConversation } from '../../../../lib/supabase/queries';

type V2AbsenceSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  userId: string;
};

export function V2AbsenceSheet({ open, onOpenChange, studentName, userId }: V2AbsenceSheetProps) {
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!date) return;
    setSending(true);
    setError(null);
    try {
      const conversation = await getGlobalConversation();
      if (!conversation) throw new Error('Could not find the group chat.');
      const messageBody = `[Absence Notice] ${studentName} will be absent on ${date}${note ? `. Note: ${note}` : '.'} `;
      await createMessage({
        conversation_id: conversation.conversation_id,
        author_user_id: userId,
        body: messageBody,
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setDate('');
        setNote('');
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8 max-w-lg mx-auto">
        <SheetHeader className="mb-5">
          <SheetTitle>Let us know about an absence</SheetTitle>
          <SheetDescription>
            Send a message to staff about {studentName}'s upcoming absence.
          </SheetDescription>
        </SheetHeader>

        {sent ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-foreground">Message sent!</p>
            <p className="text-sm text-muted-foreground mt-1">Staff will see your absence notice.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="absence-date" className="text-base font-medium">
                Date of absence <span className="text-destructive">*</span>
              </Label>
              <Input
                id="absence-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 h-12 text-base"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="absence-note" className="text-base font-medium">
                Additional note (optional)
              </Label>
              <Textarea
                id="absence-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. vacation, appointment, sick day..."
                className="mt-1.5 text-base resize-none"
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1 h-12 text-base"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 text-base"
                disabled={!date || sending}
                onClick={handleSend}
              >
                {sending ? 'Sending...' : 'Send Notice'}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
