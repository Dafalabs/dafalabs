import Script from "next/script";

export function ConsentScript() {
  const src = process.env.CONSENT_SCRIPT_URL?.trim();

  if (!src) return null;

  return <Script src={src} strategy="beforeInteractive" />;
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
