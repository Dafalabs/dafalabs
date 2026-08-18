import Script from "next/script";

import { ConsentScript } from "@/components/consent-script";

export function Consent() {
  const src = process.env.CONSENT_SCRIPT_URL?.trim();

  if (!src) return null;

  return (
    <>
      <link rel="preconnect" href={new URL(src).origin} />
      <ConsentScript src={src} />
    </>
  );
}

export function Analytics() {
  const id = process.env.GA_MEASUREMENT_ID?.trim();

  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`}
      </Script>
    </>
  );
}
