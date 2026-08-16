import { Reveal, RevealText } from "@/components/motion-primitives";
import { Link } from "@/i18n/navigation";

export function CtaBand({
  label,
  title,
  body,
  button,
}: {
  label?: string;
  title: string;
  body: string;
  button: string;
}) {
  return (
    <section className="border-t border-line bg-ink-raised">
      <div className="container-page py-28 md:py-36">
        <div className="grid gap-12 md:grid-cols-[16rem_1fr]">
          {label && (
            <Reveal>
              <p className="label">{label}</p>
            </Reveal>
          )}

          <div className="max-w-3xl">
            <RevealText as="h2" className="display-md">
              {title}
            </RevealText>

            <Reveal delay={0.15}>
              <p className="mt-8 max-w-[52ch] text-lg leading-relaxed text-ash">
                {body}
              </p>
            </Reveal>

            <Reveal delay={0.25}>
              <Link
                href="/contact"
                className="group mt-12 inline-flex items-center gap-3 bg-brass px-7 py-4 text-sm font-medium text-ink transition-colors hover:bg-bone"
              >
                {button}
                <span className="transition-transform duration-500 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
