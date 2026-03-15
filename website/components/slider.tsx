"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** Collapsed strip height: only icon + title visible. */
const COLLAPSED_HEIGHT_CLAMP = "clamp(2.75rem, 8vh, 5rem)";
const AUTOPLAY_MS = 10000;

/** Renders title with optional gradient on a substring; gradient only when expanded. */
function TitleWithGradient({
  title,
  titleGradientPart,
  isExpanded,
}: {
  title: string;
  titleGradientPart: string;
  isExpanded: boolean;
}) {
  if (!titleGradientPart || !title.includes(titleGradientPart)) {
    return <>{title}</>;
  }
  const i = title.indexOf(titleGradientPart);
  const before = title.slice(0, i);
  const part = title.slice(i, i + titleGradientPart.length);
  const after = title.slice(i + titleGradientPart.length);
  return (
    <>
      {before}
      <span
        className={
          isExpanded
            ? "gradient-text transition-colors duration-300"
            : "text-foreground transition-colors duration-300"
        }
      >
        {part}
      </span>
      {after}
    </>
  );
}

export const Slider = ({
  autoplay = false,
  items,
}: {
  autoplay?: boolean;
  items: {
    title: string;
    titleGradientPart: string;
    description: string;
    icon: React.ReactNode;
    sideContent: React.ReactNode;
  }[];
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const isPausedRef = useRef(false);

  useEffect(() => {
    if (items.length <= 1 || !autoplay) return;
    const id = setInterval(() => {
      if (!isPausedRef.current) {
        setActiveIndex((prev) => (prev + 1) % items.length);
      }
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [items.length, autoplay]);

  const pauseAutoplay = () => {
    isPausedRef.current = true;
  };
  const resumeAutoplay = () => {
    isPausedRef.current = false;
  };

  if (!items?.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      <div className="space-y-8 xl:col-span-2">
        <div
          className="flex flex-col w-full gap-6 overflow-hidden rounded-lg"
          onMouseEnter={pauseAutoplay}
          onMouseLeave={resumeAutoplay}
        >
          {items.map((item, i) => {
            const isExpanded = i === activeIndex;
            return (
              <motion.div
                key={i + "slider"}
                layout
                className={`relative overflow-hidden rounded-xl cursor-pointer flex flex-col border transition-colors duration-300 ${
                  isExpanded
                    ? "bg-gradient-to-br from-violet-50 via-fuchsia-50/80 to-amber-50 border-violet-200/70 shadow-md"
                    : "bg-white/50 border-white/40 shadow-sm backdrop-blur-sm"
                }`}
                style={{
                  flex: isExpanded ? "1 1 0%" : "0 0 auto",
                  height: isExpanded ? undefined : COLLAPSED_HEIGHT_CLAMP,
                  minHeight: isExpanded ? 0 : COLLAPSED_HEIGHT_CLAMP,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={() => setActiveIndex(i)}
              >
                {/* Collapsed: icon + title only */}
                <div className="flex">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-8 pt-4 px-4">
                      <div className={`flex items-center justify-center shrink-0`}>
                        {item.icon}
                      </div>
                      <motion.h3
                        layout
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        <TitleWithGradient
                          title={item.title}
                          titleGradientPart={item.titleGradientPart}
                          isExpanded={isExpanded}
                        />
                      </motion.h3>
                    </div>
                    <motion.p
                      layout
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      initial={false}
                      animate={{ opacity: isExpanded ? 1 : 0 }}
                      className="text-lg text-muted-foreground p-4"
                    >
                      {item.description}
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {items.length > 1 && (
          <div className="flex justify-start gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setActiveIndex(i)}
                className={`
                h-2 rounded-full transition-all
                ${i === activeIndex ? "w-6 bg-primary" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60"}
              `}
              />
            ))}
          </div>
        )}
      </div>
      <div className="w-full aspect-[480/640]">
        {items[activeIndex].sideContent}
      </div>
    </div>
  );
};
