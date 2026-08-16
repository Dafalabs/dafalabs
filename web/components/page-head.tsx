import { Reveal, RevealText } from "@/components/motion-primitives";

export function PageHead({
  label,
  heading,
  lede,
}: {
  label: string;
  heading: string;
  lede?: string;
}) {
  return (
    <section className="border-b border-line pb-16 pt-40 md:pb-24 md:pt-52">
      <div className="container-page">
        <div className="grid gap-10 md:grid-cols-[16rem_1fr]">
          <Reveal>
            <p className="label">{label}</p>
          </Reveal>

          <div>
            <RevealText as="h1" className="display-lg max-w-[16ch]">
              {heading}
            </RevealText>

            {lede && (
              <Reveal delay={0.2}>
                <p className="mt-10 max-w-[52ch] text-lg leading-relaxed text-ash">
                  {lede}
                </p>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
