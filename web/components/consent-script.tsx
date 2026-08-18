"use client";

import Script from "next/script";

declare global {
  interface Window {
    cookiehub?: { load: (config: Record<string, unknown>) => void };
  }
}

export function ConsentScript({ src }: { src: string }) {
  return (
    <Script
      src={src}
      strategy="afterInteractive"
      onLoad={() => window.cookiehub?.load({})}
    />
  );
}
