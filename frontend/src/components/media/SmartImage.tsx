import Image from "next/image";
import { cn, mediaUrl } from "@/lib/utils";

/**
 * Image robuste : lazy + repli motif terre si absente. Le flou des mineurs est
 * appliqué côté serveur (dérivé pré-flouté) ; ici on ne fait qu'afficher.
 */
export function SmartImage({
  path,
  alt,
  className,
  blur = false,
  priority = false,
}: {
  path: string;
  alt: string;
  className?: string;
  blur?: boolean;
  priority?: boolean;
}) {
  const src = mediaUrl(path);

  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-sand-200 via-clay-100 to-ochre-400/30",
          className,
        )}
        aria-label={alt}
      >
        <svg width="56" height="56" viewBox="0 0 32 32" fill="none" className="opacity-40">
          <path
            d="M16 28S4 20.5 4 12.5C4 8 7.4 5 11.2 5 13.6 5 15.3 6.4 16 8c.7-1.6 2.4-3 4.8-3C24.6 5 28 8 28 12.5 28 20.5 16 28 16 28Z"
            fill="#A8431F"
          />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, 33vw"
      priority={priority}
      className={cn("object-cover", blur && "blur-xl scale-105", className)}
    />
  );
}
