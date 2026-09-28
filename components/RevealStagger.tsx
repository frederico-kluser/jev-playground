"use client";

/**
 * Entrance reveal for the key gate: a headline and follower elements rise in
 * sequence. Public Motion only (`motion/react`), reduced-motion aware.
 * (Replaces the Motion UI `stagger-reveal` section, which pulls `splitText`
 * from the private `motion-plus` registry and breaks dependency installs on
 * CI/Vercel without the Motion+ token.)
 */

import { motion, useReducedMotion } from "motion/react";
import { type ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function RevealStagger({
  headline,
  children,
  className,
}: {
  headline: string;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const item = (delay: number) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: EASE },
        };

  return (
    <div className={className}>
      <motion.h1
        {...item(0)}
        className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
      >
        {headline}
      </motion.h1>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} {...item(0.12 + index * 0.09)}>
              {child}
            </motion.div>
          ))
        : <motion.div {...item(0.12)}>{children}</motion.div>}
    </div>
  );
}