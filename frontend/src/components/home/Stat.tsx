export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-display text-3xl font-semibold text-clay-600">{value}</span>
      <span className="mt-1 text-xs leading-snug text-ink-soft">{label}</span>
    </div>
  );
}
