import { cn } from "@/lib/utils";

/** Marque Africœur : un cœur stylisé évoquant le continent / une goutte solidaire. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <path
          d="M16 28S4 20.5 4 12.5C4 8 7.4 5 11.2 5 13.6 5 15.3 6.4 16 8c.7-1.6 2.4-3 4.8-3C24.6 5 28 8 28 12.5 28 20.5 16 28 16 28Z"
          fill="#C2562F"
        />
        <path
          d="M16 26S6.5 19.6 6.5 12.9C6.5 9.4 9 7 11.7 7c1.9 0 3.3 1 4.3 2.6"
          stroke="#D8901A"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight text-ink">
        Afric<span className="text-clay-500">œur</span>
      </span>
    </span>
  );
}
