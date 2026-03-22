"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

/**
 * Thumbnail grid with a Motion-powered lightbox (backdrop fade + springy image).
 * Register in `mdx-components.tsx` and use in MDX.
 *
 * <ImageLightboxGrid
 *   anchorPrefix="my-doc"
 *   images={[{ src: "/a.png", alt: "A" }]}
 * />
 */
type ImageItem = {
  src: string;
  alt: string;
};

type Props = {
  images: ImageItem[];
  /** Stable prefix for React keys when multiple grids exist on one page. */
  anchorPrefix?: string;
};

export function ImageLightboxGrid({
  images,
  anchorPrefix = "ilg",
}: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduceMotion = usePrefersReducedMotion();

  const close = useCallback(() => setOpenIndex(null), []);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close]);

  useEffect(() => {
    if (openIndex === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openIndex]);

  const softTransition = reduceMotion
    ? { duration: 0.15 }
    : { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.85 };

  const backdropTransition = reduceMotion
    ? { duration: 0.2 }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

  const active = openIndex !== null ? images[openIndex] : null;

  return (
    <div className="not-prose my-5 @container/ilg">
      <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 @sm/ilg:grid-cols-3">
        {images.map((item, i) => {
          const id = `${anchorPrefix}-${i}`;
          return (
            <li key={id} className="m-0">
              <motion.button
                type="button"
                onClick={() => setOpenIndex(i)}
                className="group block w-full overflow-hidden rounded-lg border border-zinc-100 shadow-md outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500"
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                  className="block aspect-square w-full object-cover transition-transform duration-150 ease-out motion-reduce:transition-none group-hover:scale-[1.03]"
                />
              </motion.button>
            </li>
          );
        })}
      </ul>

      <AnimatePresence mode="wait">
        {active && openIndex !== null ? (
          <motion.div
            key={`lb-${anchorPrefix}-${openIndex}`}
            role="dialog"
            aria-modal="true"
            aria-label={active.alt}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
          >
            <motion.button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-black/88"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={backdropTransition}
              onClick={close}
            />

            <motion.figure
              className="relative z-10 m-0 max-h-[90vh] max-w-[min(92vw,56rem)]"
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={softTransition}
            >
              <motion.button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute -right-1 -top-1 z-20 flex size-9 translate-y-[-100%] items-center justify-center rounded-full bg-white/95 text-2xl leading-none text-neutral-900 shadow-md hover:bg-white"
                whileHover={reduceMotion ? undefined : { scale: 1.06 }}
                whileTap={reduceMotion ? undefined : { scale: 0.94 }}
              >
                ×
              </motion.button>
              <img
                src={active.src}
                alt={active.alt}
                className="mx-auto block h-auto max-h-[min(85vh,900px)] w-auto max-w-full rounded-lg object-contain shadow-[0_8px_32px_rgb(0_0_0/0.35)]"
              />
            </motion.figure>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
