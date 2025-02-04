export const AnimatedUnderline = ({ className }: { className?: string }) => (
  <div
    className={`absolute bottom-0 right-0 left-0 border-b-2 border-pink-500 delay-200 duration-300 origin-left transition-all scale-x-0 group-hover/animated-underline:scale-x-100 ${className}`}
  />
);
