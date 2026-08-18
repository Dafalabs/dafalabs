import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion-primitives";

const STEPS = ["talk", "scope", "build", "ship"] as const;

export async function ProcessSteps() {
  const t = await getTranslations("process.steps");

  return (
    <ol className="grid gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((key, index) => (
        <Reveal
          key={key}
          as="li"
          delay={index * 0.08}
          className="flex flex-col gap-4 border-t border-line pt-6"
        >
          <span className="label text-brass">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="font-display text-xl tracking-tight">
            {t(`${key}.name`)}
          </h3>
          <p className="text-sm leading-relaxed text-ash">{t(`${key}.body`)}</p>
        </Reveal>
      ))}
    </ol>
  );
}
