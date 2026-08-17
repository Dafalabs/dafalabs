"use client";

import { motion, useReducedMotion } from "motion/react";

export function Marquee({ items }: { items: string[] }) {
  const reduced = useReducedMotion();

  const group = (
    <span className="flex shrink-0 items-center" aria-hidden>
      {items.map((item) => (
        <span key={item} className="flex items-center">
          <span className="px-8 font-display text-2xl tracking-tight text-bone/70 md:px-12 md:text-4xl">
            {item}
          </span>
          <span className="h-1.5 w-1.5 rotate-45 bg-brass" />
        </span>
      ))}
    </span>
  );

  return (
    <div className="relative overflow-hidden border-y border-line py-7 md:py-9">
      <span className="sr-only">{items.join(", ")}</span>

      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink to-transparent md:w-28"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink to-transparent md:w-28"
        aria-hidden
      />

      {reduced ? (
        <div className="flex justify-center">{group}</div>
      ) : (
        <motion.div
          className="flex w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 26, ease: "linear", repeat: Infinity }}
        >
          {group}
          {group}
        </motion.div>
      )}
    </div>
  );
}
