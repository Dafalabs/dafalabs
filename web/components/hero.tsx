"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { RotatingHeadline } from "@/components/rotating-headline";
import { Link } from "@/i18n/navigation";

const EASE = [0.16, 1, 0.3, 1] as const;
const INTRO_KEY = "dafalabs-intro";

type HeroProps = {
  line1: string;
  rotating: string[];
  lede: string;
  cta: string;
  secondary: string | null;
  scroll: string;
};

const subscribeIntro = () => () => {};
const introSeenOnClient = () => sessionStorage.getItem(INTRO_KEY) !== null;
const introSeenOnServer = () => true;

export function Hero({ line1, rotating, lede, cta, secondary, scroll }: HeroProps) {
  const reduced = useReducedMotion();
  const seen = useSyncExternalStore(
    subscribeIntro,
    introSeenOnClient,
    introSeenOnServer,
  );
  const [dismissed, setDismissed] = useState(false);

  const showCurtain = !seen && !reduced && !dismissed;

  const finishIntro = () => {
    sessionStorage.setItem(INTRO_KEY, "1");
    setDismissed(true);
  };

  const base = showCurtain ? 1.15 : 0.1;

  return (
    <>
      <AnimatePresence>
        {showCurtain && <Curtain onDone={finishIntro} />}
      </AnimatePresence>

      <HeroSection
        line1={line1}
        rotating={rotating}
        lede={lede}
        cta={cta}
        secondary={secondary}
        scroll={scroll}
        base={base}
      />
    </>
  );
}

function Curtain({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      document.body.style.overflow = "";
      onDone();
    }, 1200);
    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(timer);
    };
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-100 flex items-center justify-center bg-ink"
      initial={{ y: 0 }}
      exit={{ y: "-100%" }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <div className="flex flex-col items-center gap-6">
        <motion.span
          className="font-display text-3xl font-semibold tracking-tight"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          dafa<span className="text-brass">labs</span>
        </motion.span>

        <div className="h-px w-40 overflow-hidden bg-line">
          <motion.div
            className="h-px w-full bg-brass"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.95, ease: [0.65, 0, 0.35, 1], delay: 0.1 }}
            style={{ transformOrigin: "left" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function HeroSection({
  line1,
  rotating,
  lede,
  cta,
  secondary,
  scroll,
  base,
}: HeroProps & { base: number }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const lift = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const liftSlow = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.35);
  const glowX = useSpring(pointerX, { stiffness: 60, damping: 20 });
  const glowY = useSpring(pointerY, { stiffness: 60, damping: 20 });

  const glowLeft = useTransform(glowX, (value) => `${value * 100}%`);
  const glowTop = useTransform(glowY, (value) => `${value * 100}%`);

  const spotlight = useTransform(
    [glowX, glowY],
    ([px, py]: number[]) =>
      `radial-gradient(circle 260px at ${px * 100}% ${py * 100}%, black 0%, rgba(0,0,0,0.35) 45%, transparent 75%)`,
  );

  useEffect(() => {
    if (reduced) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (event: PointerEvent) => {
      const bounds = ref.current?.getBoundingClientRect();
      if (!bounds) return;
      pointerX.set((event.clientX - bounds.left) / bounds.width);
      pointerY.set((event.clientY - bounds.top) / bounds.height);
    };

    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [pointerX, pointerY, reduced]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-svh flex-col justify-end overflow-hidden pb-16 pt-32"
    >
      <div className="grid-field pointer-events-none absolute inset-0 opacity-40" aria-hidden />

      {!reduced && (
        <>
          <motion.div
            aria-hidden
            className="grid-field pointer-events-none absolute inset-0"
            style={{
              maskImage: spotlight,
              WebkitMaskImage: spotlight,
              filter: "brightness(4) sepia(1) saturate(6) hue-rotate(-12deg)",
            }}
          />

          <motion.div
            aria-hidden
            className="pointer-events-none absolute h-[46vmax] w-[46vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: glowLeft,
              top: glowTop,
              background:
                "radial-gradient(circle, rgba(224,163,60,0.10) 0%, rgba(224,163,60,0.03) 40%, transparent 70%)",
            }}
          />
        </>
      )}

      <motion.div className="container-page relative" style={{ y: lift, opacity: fade }}>
        <Line text={lede} base={base} reduced={reduced} className="label mb-10 block" />

        <RotatingHeadline fixed={line1} rotating={rotating} base={base + 0.12} />

        <motion.div
          className="mt-14 flex flex-wrap items-center gap-8"
          initial={reduced ? undefined : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: base + 0.75 }}
        >
          <Link
            href="/contact"
            className="group relative inline-flex items-center gap-3 overflow-hidden bg-brass px-7 py-4 text-sm font-medium text-ink"
          >
            <span className="absolute inset-0 -translate-x-full bg-bone transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0" />
            <span className="relative">{cta}</span>
            <span className="relative transition-transform duration-500 group-hover:translate-x-1">
              →
            </span>
          </Link>

          {secondary && (
            <Link
              href="/work"
              className="group inline-flex items-center gap-3 text-sm text-ash transition-colors hover:text-bone"
            >
              {secondary}
              <span className="transition-transform duration-500 group-hover:translate-x-1">
                →
              </span>
            </Link>
          )}
        </motion.div>
      </motion.div>

      <motion.div
        className="container-page relative mt-20"
        style={{ y: liftSlow, opacity: fade }}
        initial={reduced ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: EASE, delay: base + 0.95 }}
      >
        <div className="flex items-center gap-4">
          <span className="label">{scroll}</span>
          <span className="relative h-px w-16 overflow-hidden bg-line-strong">
            {!reduced && (
              <motion.span
                className="absolute inset-y-0 left-0 w-6 bg-brass"
                animate={{ x: ["-100%", "300%"] }}
                transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.6 }}
              />
            )}
          </span>
        </div>
      </motion.div>
    </section>
  );
}

function Line({
  text,
  base,
  reduced,
  className = "",
}: {
  text: string;
  base: number;
  reduced: boolean | null;
  className?: string;
}) {
  if (reduced) return <span className={className}>{text}</span>;

  return (
    <span className={`mask-line ${className}`}>
      <motion.span
        className="block"
        initial={{ y: "110%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1, ease: EASE, delay: base }}
      >
        {text}
      </motion.span>
    </span>
  );
}
