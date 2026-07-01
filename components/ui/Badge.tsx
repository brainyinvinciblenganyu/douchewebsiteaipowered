export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const badgeStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-900',
  success: 'bg-emerald-100 text-emerald-900',
  warning: 'bg-amber-100 text-amber-900',
  danger: 'bg-rose-100 text-rose-900',
  info: 'bg-sky-100 text-sky-900',
};

export default function Badge({
  children,
  variant = 'neutral',
  className = '',
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${badgeStyles[variant]} ${className}`.trim()}>
      {children}
    </span>
  );
}
