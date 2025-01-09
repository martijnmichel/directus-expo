import { useWindowDimensions } from "react-native";
import { breakpoints } from "../unistyles/theme";

export const useResponsive = () => {
  const { width } = useWindowDimensions();

  return {
    isXs: width >= breakpoints.xs,
    isSm: width >= breakpoints.sm,
    isMd: width >= breakpoints.md,
    isLg: width >= breakpoints.lg,
    isXl: width >= breakpoints.xl,

    // Helper for responsive values
    value: <T>(values: {
      base?: T;
      xs?: T;
      sm?: T;
      md?: T;
      lg?: T;
      xl?: T;
    }): T => {
      const { base, xs, sm, md, lg, xl } = values;

      if (width >= breakpoints.xl && xl) return xl;
      if (width >= breakpoints.lg && lg) return lg;
      if (width >= breakpoints.md && md) return md;
      if (width >= breakpoints.sm && sm) return sm;
      if (width >= breakpoints.xs && xs) return xs;
      return base as T;
    },
  };
};
