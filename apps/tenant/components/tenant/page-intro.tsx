export function PageIntro({
  title,
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      {title && <h2 className="text-base font-semibold tracking-tight">{title}</h2>}
      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {children}
      </h3>
      {action}
    </div>
  );
}
