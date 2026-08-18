"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useState, useSyncExternalStore } from "react";

const INTERACTIVE = "a, button, label, input, textarea, select, [role='button']";
const FINE_POINTER = "(pointer: fine)";

const subscribeFinePointer = (onChange: () => void) => {
  const query = window.matchMedia(FINE_POINTER);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const finePointerOnClient = () => window.matchMedia(FINE_POINTER).matches;
const finePointerOnServer = () => false;

export function Cursor() {
  const reduced = useReducedMotion();
  const finePointer = useSyncExternalStore(
    subscribeFinePointer,
    finePointerOnClient,
    finePointerOnServer,
  );

  const enabled = finePointer && !reduced;

  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  const ringX = useSpring(x, { stiffness: 320, damping: 34, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 320, damping: 34, mass: 0.5 });

  useEffect(() => {
    if (!enabled) return;

    document.documentElement.classList.add("has-cursor");

    const onMove = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
      setActive(Boolean((event.target as Element).closest?.(INTERACTIVE)));
    };

    const onLeave = () => setVisible(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-200 mix-blend-difference" aria-hidden>
      <motion.span
        className="absolute h-1.5 w-1.5 rounded-full bg-bone"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: visible && !active ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      />

      <motion.span
        className="absolute rounded-full border border-bone"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: active ? 52 : 26,
          height: active ? 52 : 26,
          opacity: visible ? (active ? 1 : 0.55) : 0,
          backgroundColor: active ? "rgba(244,245,246,0.22)" : "rgba(244,245,246,0)",
        }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
