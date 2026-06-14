import { routing } from "./src/i18n/routing";
import { createNavigation } from "next-intl/navigation";

const { useRouter, usePathname } = createNavigation(routing);

function Test() {
  const router = useRouter();
  const pathname = usePathname();
  router.replace(pathname, { locale: "en" });
  router.replace({ pathname }, { locale: "en" });
}
