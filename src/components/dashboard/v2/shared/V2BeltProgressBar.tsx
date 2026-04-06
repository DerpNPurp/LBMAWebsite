const BELT_LADDER = [
  { label: 'White', bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' },
  { label: 'Yellow', bg: 'bg-yellow-400', border: 'border-yellow-500', text: 'text-yellow-900' },
  { label: 'Orange', bg: 'bg-orange-400', border: 'border-orange-500', text: 'text-orange-900' },
  { label: 'Purple', bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-white' },
  { label: 'Blue', bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' },
  { label: 'Green', bg: 'bg-green-500', border: 'border-green-600', text: 'text-white' },
  { label: 'Brown', bg: 'bg-amber-800', border: 'border-amber-900', text: 'text-white' },
  { label: 'Red', bg: 'bg-red-600', border: 'border-red-700', text: 'text-white' },
  { label: 'Black', bg: 'bg-gray-900', border: 'border-black', text: 'text-white' },
];

type V2BeltProgressBarProps = {
  beltLevel: string;
};

export function V2BeltProgressBar({ beltLevel }: V2BeltProgressBarProps) {
  const normalizedLevel = beltLevel?.toLowerCase().replace(' belt', '').trim() ?? '';
  const currentIndex = BELT_LADDER.findIndex(
    (b) => b.label.toLowerCase() === normalizedLevel
  );

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {BELT_LADDER.map((belt, index) => {
        const isActive = index === currentIndex;
        const isPassed = index < currentIndex;
        return (
          <div
            key={belt.label}
            title={`${belt.label} Belt`}
            className={[
              'h-4 w-6 rounded-sm border transition-all',
              belt.bg,
              belt.border,
              isActive ? 'ring-2 ring-primary ring-offset-1 scale-110' : '',
              !isPassed && !isActive ? 'opacity-30' : '',
            ].join(' ')}
          />
        );
      })}
      {currentIndex >= 0 && (
        <span className="ml-1 text-xs text-muted-foreground font-medium">
          {BELT_LADDER[currentIndex].label} Belt
        </span>
      )}
    </div>
  );
}
