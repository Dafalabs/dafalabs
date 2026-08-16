"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;
const HOLD = 2800;

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
      <Chars text={fixed} base={base} reduced={reduced} />

      <span className="mask-line block text-ash">
        {reduced ? (
          <span className="block">{rotating[0]}</span>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={current}
              className="block will-change-transform"
              initial={{ y: "115%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-115%", opacity: 0 }}
              transition={{
                y: { duration: 0.85, ease: EASE },
                opacity: { duration: 0.35, ease: "easeOut" },
              }}
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
  base,
  reduced,
}: {
  text: string;
  base: number;
  reduced: boolean | null;
}) {
  if (reduced) return <span className="block">{text}</span>;

  return (
    <span className="block" aria-label={text}>
      {text.split("").map((char, index) => (
        <span key={`${char}-${index}`} className="mask-line inline-block" aria-hidden>
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: "115%", rotate: 5 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{
              duration: 1.1,
              ease: EASE,
              delay: base + index * 0.045,
            }}
          >
            {char}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
