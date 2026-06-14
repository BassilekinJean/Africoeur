"use client";

import { mediaUrl } from "@/lib/utils";

/**
 * Lecteur léger : `preload="none"` + lecture progressive via requêtes HTTP Range
 * de Supabase Storage (préserve la RAM des appareils bas de gamme).
 */
export function VideoPlayer({ path, poster }: { path: string; poster?: string }) {
  const src = mediaUrl(path);
  if (!src) return null;
  return (
    <video
      controls
      preload="none"
      poster={poster ? mediaUrl(poster) : undefined}
      className="aspect-video w-full rounded-2xl border border-ink/10 bg-ink object-cover shadow-soft"
    >
      <source src={src} />
    </video>
  );
}
