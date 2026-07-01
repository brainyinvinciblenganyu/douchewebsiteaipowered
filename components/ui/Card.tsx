export default function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_20px_45px_rgba(15,23,42,0.08)] ${className}`.trim()}>
      {children}
    </div>
  );
}
