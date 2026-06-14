import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("progress-track", className)} role="progressbar" aria-valuenow={Math.round(pct)}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
