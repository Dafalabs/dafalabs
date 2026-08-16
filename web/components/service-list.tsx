import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion-primitives";

const KEYS = ["mobile", "web", "design", "consulting"] as const;

export async function ServiceList({
  variant = "short",
}: {
  variant?: "short" | "long";
}) {
  const t = await getTranslations("services.items");

  return (
    <div className="border-t border-line">
      {KEYS.map((key, index) => (
        <Reveal key={key} delay={index * 0.06}>
          <article className="group relative grid gap-4 border-b border-line py-10 transition-colors duration-500 md:grid-cols-[5rem_18rem_1fr] md:items-baseline md:gap-10">

            <span className="pointer-events-none absolute inset-y-0 -inset-x-4 -z-10 scale-x-0 bg-ink-raised transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 md:-inset-x-8" />

            <span className="label transition-colors duration-500 group-hover:text-brass">
              {String(index + 1).padStart(2, "0")}
            </span>

            <h3 className="font-display text-2xl tracking-tight md:text-3xl">
              {t(`${key}.name`)}
            </h3>

            <p className="max-w-[52ch] text-ash">
              {t(`${key}.${variant}`)}
            </p>
          </article>
        </Reveal>
      ))}
    </div>
  );
}
