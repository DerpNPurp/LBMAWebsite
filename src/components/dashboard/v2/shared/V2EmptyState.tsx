import type { LucideIcon } from 'lucide-react';
import { Button } from '../../../ui/button';

type V2EmptyStateProps = {
  icon: LucideIcon;
  heading: string;
  body: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function V2EmptyState({ icon: Icon, heading, body, action }: V2EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{heading}</h3>
      <p className="text-muted-foreground text-base max-w-sm leading-relaxed">{body}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-6">
          {action.label}
        </Button>
      )}
    </div>
  );
}
