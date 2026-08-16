import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { StaticPathname } from "@/i18n/routing";
import type { Social, SiteContact } from "@/lib/api";

const NAV: { href: StaticPathname; key: "services" | "work" | "posts" | "contact" }[] = [
  { href: "/services", key: "services" },
  { href: "/work", key: "work" },
  { href: "/posts", key: "posts" },
  { href: "/contact", key: "contact" },
];

const ACCOUNT_NAV: { href: StaticPathname; key: "tracking" | "login" }[] = [
  { href: "/tracking", key: "tracking" },
  { href: "/login", key: "login" },
];

export async function SiteFooter({
  contact,
  hasProjects,
  hasPosts,
}: {
  contact: SiteContact;
  hasProjects: boolean;
  hasPosts: boolean;
}) {
  const hidden = new Set<string>();
  if (!hasProjects) hidden.add("/work");
  if (!hasPosts) hidden.add("/posts");

  const siteNav = NAV.filter((item) => !hidden.has(item.href));
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");

  return (
    <footer className="border-t border-line bg-ink-deep">
      <div className="container-page py-20">
        <div className="grid gap-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <span className="font-display text-xl font-semibold tracking-tight">
              dafa<span className="text-brass">labs</span>
            </span>
            <p className="max-w-[32ch] text-sm leading-relaxed text-ash">
              {t("description")}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="label">{t("site")}</h2>
            {siteNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-ash transition-colors hover:text-bone"
              >
                {nav(item.key)}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="label">{t("account")}</h2>
            {ACCOUNT_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-ash transition-colors hover:text-bone"
              >
                {nav(item.key)}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="label">{t("contact")}</h2>
            <a
              href={`mailto:${contact.email}`}
              className="text-sm text-ash transition-colors hover:text-bone"
            >
              {contact.email}
            </a>

            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="text-sm text-ash transition-colors hover:text-bone"
              >
                {contact.phone}
              </a>
            )}
            {contact.location && (
              <p className="text-sm text-ash">{contact.location}</p>
            )}
          </div>

          {contact.socials.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="label">{t("follow")}</h2>
              {contact.socials.map((social: Social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ash transition-colors hover:text-bone"
                >
                  {social.name}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8 font-mono text-xs text-ash">
          <span>© {new Date().getFullYear()} dafalabs</span>
          <span>{t("country")}</span>
        </div>
      </div>
    </footer>
  );
}
