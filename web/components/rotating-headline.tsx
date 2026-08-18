"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;
const WIPE = [0.76, 0, 0.24, 1] as const;
const HOLD = 3200;

export function RotatingHeadline({
  fixed,
  rotating,
  base,
}: {
  fixed: string;
  rotating: string[];
  base: number;
}) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced || rotating.length < 2) return;

    const interval = window.setInterval(() => {
      setIndex((value) => (value + 1) % rotating.length);
    }, HOLD);

    return () => window.clearInterval(interval);
  }, [reduced, rotating.length]);

  const current = rotating[index];

  return (
    <h1 className="display-xl">
      <span className="outline-type block">
        <Chars text={fixed} delay={base} reduced={reduced} />
      </span>

      <span className="mask-line block pl-[8vw] text-brass md:pl-[14vw]">
        {reduced ? (
          <span className="block">{rotating[0]}</span>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={current}
              className="block will-change-[clip-path]"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              exit={{ clipPath: "inset(0 0 0 100%)" }}
              transition={{ duration: 0.55, ease: WIPE }}
            >
              {current}
            </motion.span>
          </AnimatePresence>
        )}
      </span>
    </h1>
  );
}

function Chars({
  text,
  delay,
  reduced,
}: {
  text: string;
  delay: number;
  reduced: boolean | null;
}) {
  if (reduced) return <span className="block">{text}</span>;

  return (
    <span className="block" aria-label={text}>
      {Array.from(text).map((char, index) => (
        <span key={`${char}-${index}`} className="mask-line inline-block" aria-hidden>
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: "115%", rotate: 5 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ duration: 1.1, ease: EASE, delay: delay + index * 0.045 }}
          >
            {char}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
