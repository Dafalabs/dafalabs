"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function RevealText({
  children,
  as: Tag = "span",
  className = "",
  delay = 0,
  stagger = 0.045,
}: {
  children: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  const words = children.split(" ");

  if (reduced) return <Tag className={className}>{children}</Tag>;

  return (
    <Tag className={className}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="mask-line inline-block">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{
              duration: 1,
              ease: EASE,
              delay: delay + index * stagger,
            }}
          >
            {word}
            {index < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 28,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setForced(true), 1600);
    return () => window.clearTimeout(timer);
  }, []);

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView || forced ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export function RevealLine({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setForced(true), 1600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div ref={ref} className={`h-px w-full bg-line ${className}`}>
      {!reduced && (
        <motion.div
          className="h-px bg-line-strong"
          initial={{ scaleX: 0 }}
          animate={inView || forced ? { scaleX: 1 } : undefined}
          transition={{ duration: 1.2, ease: EASE }}
          style={{ transformOrigin: "left" }}
        />
      )}
    </div>
  );
}
