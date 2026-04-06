type V2PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function V2PageHeader({ title, description, action }: V2PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground leading-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-base mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
