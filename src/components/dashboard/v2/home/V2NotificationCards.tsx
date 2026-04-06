import { MessageCircle, Bell, ClipboardList } from 'lucide-react';

type V2NotificationCardsProps = {
  unreadMessages: number;
  newFeedback: number;
  newAnnouncements: number;
  onNavigate: (section: 'messages' | 'feedback' | 'announcements') => void;
};

type NotifCardProps = {
  icon: React.ElementType;
  label: string;
  count: number;
  description: string;
  onClick: () => void;
  color: string;
};

function NotifCard({ icon: Icon, label, count, description, onClick, color }: NotifCardProps) {
  const hasItems = count > 0;
  return (
    <button
      onClick={onClick}
      className={[
        'flex-1 min-w-[140px] flex flex-col items-start gap-2 p-4 rounded-2xl border transition-all text-left',
        hasItems
          ? `${color} shadow-sm hover:shadow-md`
          : 'bg-muted/40 border-border hover:bg-muted/60',
      ].join(' ')}
    >
      <div className={['w-10 h-10 rounded-xl flex items-center justify-center', hasItems ? 'bg-white/20' : 'bg-muted'].join(' ')}>
        <Icon className={['w-5 h-5', hasItems ? 'text-current' : 'text-muted-foreground'].join(' ')} />
      </div>
      <div>
        <p className={['text-2xl font-bold leading-none', hasItems ? 'text-current' : 'text-foreground'].join(' ')}>
          {count > 99 ? '99+' : count}
        </p>
        <p className={['text-sm font-semibold mt-0.5', hasItems ? 'text-current' : 'text-foreground'].join(' ')}>
          {label}
        </p>
        <p className={['text-xs mt-0.5 leading-snug', hasItems ? 'text-current/80' : 'text-muted-foreground'].join(' ')}>
          {description}
        </p>
      </div>
    </button>
  );
}

export function V2NotificationCards({
  unreadMessages,
  newFeedback,
  newAnnouncements,
  onNavigate,
}: V2NotificationCardsProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      <NotifCard
        icon={MessageCircle}
        label="Messages"
        count={unreadMessages}
        description={unreadMessages > 0 ? 'Unread messages' : 'No new messages'}
        onClick={() => onNavigate('messages')}
        color="bg-primary text-primary-foreground border-primary"
      />
      <NotifCard
        icon={ClipboardList}
        label="Feedback"
        count={newFeedback}
        description={newFeedback > 0 ? 'New from instructors' : 'All caught up'}
        onClick={() => onNavigate('feedback')}
        color="bg-amber-500 text-white border-amber-500"
      />
      <NotifCard
        icon={Bell}
        label="Announcements"
        count={newAnnouncements}
        description={newAnnouncements > 0 ? 'New school updates' : 'Nothing new'}
        onClick={() => onNavigate('announcements')}
        color="bg-blue-600 text-white border-blue-600"
      />
    </div>
  );
}
