"use client";
import { usePathname, useRouter } from "./src/i18n/routing";
export function Test() {
  const router = useRouter();
  const pathname = usePathname();
  return <button onClick={() => router.replace(pathname, { locale: "en" })}>Test</button>;
}
