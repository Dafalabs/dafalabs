"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useParams } from "next/navigation";
import type { ComponentProps } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import type { StaticPathname } from "@/i18n/routing";

const NAV: { href: StaticPathname; key: "services" | "work" | "posts" | "contact" }[] = [
  { href: "/services", key: "services" },
  { href: "/work", key: "work" },
  { href: "/posts", key: "posts" },
  { href: "/contact", key: "contact" },
];

const MOBILE_NAV: {
  href: StaticPathname;
  key: "home" | "services" | "work" | "posts" | "contact" | "login" | "tracking";
}[] = [
  { href: "/", key: "home" },
  ...NAV,
  { href: "/tracking", key: "tracking" },
  { href: "/login", key: "login" },
];

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const scrolledOnClient = () => window.scrollY > 24;
const scrolledOnServer = () => false;

export function SiteHeader({
  hasProjects,
  hasPosts,
}: {
  hasProjects: boolean;
  hasPosts: boolean;
}) {
  const logo = "/logo.svg";
  const [logoBroken, setLogoBroken] = useState(false);
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    scrolledOnClient,
    scrolledOnServer,
  );
  const hidden = new Set<string>();
  if (!hasProjects) hidden.add("/work");
  if (!hasPosts) hidden.add("/posts");

  const nav = NAV.filter((item) => !hidden.has(item.href));
  const mobileNav = MOBILE_NAV.filter((item) => !hidden.has(item.href));
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);


  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        open
          ? "border-b border-line bg-ink"
          : scrolled
            ? "border-b border-line bg-ink/85 backdrop-blur-xl"
            : "border-b border-transparent"
      }`}
    >
      <div className="container-page flex h-20 items-center justify-between gap-8">
        <Link href="/" className="flex items-center gap-3" aria-label="dafalabs">
          {logo && !logoBroken ? (
            <Image
              src={logo}
              alt="dafalabs"
              width={160}
              height={32}
              className="h-7 w-auto"
              priority
              unoptimized
              onError={() => setLogoBroken(true)}
            />
          ) : (
            <span className="font-display text-xl font-semibold tracking-tight">
              dafa<span className="text-brass">labs</span>
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative label text-[0.7rem] transition-colors hover:text-bone"
              >
                <span className={active ? "text-bone" : undefined}>
                  {t(item.key)}
                </span>
                <span
                  className={`absolute -bottom-2 left-0 h-px bg-brass transition-all duration-500 ${
                    active ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="hidden label text-[0.7rem] transition-colors hover:text-bone md:block"
          >
            {t("login")}
          </Link>

          <span className="hidden h-4 w-px bg-line md:block" />

          <LanguageSwitch current={locale} />

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("close") : t("menu")}
            className="flex h-9 w-9 items-center justify-center md:hidden"
          >
            <span className="relative block h-3 w-6">
              <span
                className={`absolute left-0 block h-px w-6 bg-bone transition-all duration-300 ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 block h-px w-6 bg-bone transition-all duration-300 ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden md:hidden"
          >
            <div className="container-page flex flex-col gap-1 pb-8 pt-2">
              {mobileNav.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + index * 0.06, duration: 0.5 }}
                >
                  <Link
                    href={item.href}
                    className="block border-b border-line py-4 font-display text-2xl"
                  >
                    {t(item.key)}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

type LinkHref = ComponentProps<typeof Link>["href"];

function LanguageSwitch({ current }: { current: string }) {
  const pathname = usePathname();
  const params = useParams();

  return (
    <div className="flex items-center gap-1.5 font-mono text-[0.7rem] tracking-widest">
      {(["tr", "en"] as const).map((locale, index) => (
        <span key={locale} className="flex items-center gap-1.5">
          {index > 0 && <span className="text-ash/40">/</span>}
          <Link
            href={{ pathname, params } as LinkHref}
            locale={locale}
            className={
              current === locale
                ? "text-bone"
                : "text-ash transition-colors hover:text-bone"
            }
          >
            {locale.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}
