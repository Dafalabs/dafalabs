import type { SiteContact } from "@/lib/api";
import { SITE_URL } from "@/lib/api";

export function OrganizationSchema({
  contact,
  locale,
  description,
}: {
  contact: SiteContact;
  locale: string;
  description: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "dafalabs",
    url: `${SITE_URL}/${locale}`,
    logo: `${SITE_URL}/logo.svg`,
    description,
    email: contact.email,
    ...(contact.phone ? { telephone: contact.phone } : {}),
    ...(contact.location ? { address: { "@type": "PostalAddress", addressLocality: contact.location } } : {}),
    ...(contact.socials.length ? { sameAs: contact.socials.map((s) => s.href) } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function ArticleSchema({
  title,
  excerpt,
  slug,
  locale,
  publishedAt,
  image,
}: {
  title: string;
  excerpt: string;
  slug: string;
  locale: string;
  publishedAt: string | null;
  image: string | null;
}) {
  const path = locale === "tr" ? "yazilar" : "writing";
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: excerpt,
    inLanguage: locale,
    mainEntityOfPage: `${SITE_URL}/${locale}/${path}/${slug}`,
    ...(publishedAt ? { datePublished: publishedAt } : {}),
    ...(image ? { image: `${SITE_URL}${image}` } : {}),
    author: { "@type": "Organization", name: "dafalabs", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "dafalabs",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
