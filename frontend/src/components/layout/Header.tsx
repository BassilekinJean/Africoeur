"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart, Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/campaigns", label: t("campaigns") },
    { href: "/ngo", label: t("ngo") },
    { href: "/#how", label: t("how") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-ink/8 bg-sand-50/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="transition-transform duration-200 active:scale-[0.98]">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition-colors duration-200 hover:bg-ink/5 hover:text-ink",
                pathname === l.href && "text-ink",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher />
          <Link href="/login" className="btn-ghost">
            {t("login")}
          </Link>
          <Link href="/campaigns" className="btn-primary !py-2.5">
            <Heart size={15} strokeWidth={2.4} />
            {t("donate")}
          </Link>
        </div>

        <button
          className="rounded-full p-2 text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="animate-fade-up border-t border-ink/8 bg-sand-50 px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-ink/5"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-ink/5"
            >
              {t("login")}
            </Link>
          </nav>
          <div className="mt-4 flex items-center justify-between">
            <LocaleSwitcher />
            <Link href="/campaigns" onClick={() => setOpen(false)} className="btn-primary !py-2.5">
              <Heart size={15} strokeWidth={2.4} />
              {t("donate")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
