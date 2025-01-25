import { UnistylesTheme } from "react-native-unistyles";

export const lightTheme = {
  colors: {
    // Main colors
    primary: "#6644FF" as string, // Directus primary purple
    secondary: "#172940" as string, // Dark blue used in secondary elements

    error: "#ea7d8f" as string, // Error red
    errorBackground: "#fceef0" as string,
    errorText: "#ea7d8f" as string,
    errorBorder: "#f8d4da" as string,

    success: "#00b87c" as string, // Richer success green
    successBackground: "#e6f6f1" as string, // Light green background
    successText: "#00b87c" as string, // Match success color
    successBorder: "#ccede4" as string, // Light green border

    warning: "#ff9800" as string, // Warmer warning orange
    warningBackground: "#fff4e5" as string, // Light orange background
    warningText: "#ff9800" as string, // Match warning color
    warningBorder: "#ffe4bc" as string, // Light orange border

    // Text colors
    textPrimary: "#172940" as string, // Dark text
    textSecondary: "#4F5464" as string, // Secondary text
    textTertiary: "#8196AB" as string, // Lighter text
    textMuted: "#C8D5E9" as string, // Muted text

    // Background colors
    background: "#FFFFFF" as string,
    backgroundAlt: "#F0F4F9" as string, // Light gray background
    backgroundDark: "#e4eaf1" as string,
    backgroundDarkest: "#d4d9e1" as string,
    backgroundInvert: "#263238" as string,

    // Border colors
    border: "#e4eaf1" as string,

    // Utility colors
    white: "#FFFFFF" as string,
    black: "#000000" as string,
    overlay: "rgba(23, 41, 64, 0.8)" as string,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  borderWidth: {
    sm: 1,
    md: 2,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    body: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500" as const,
      fontFamily: "Inter_500Medium",
    },
    label: {
      fontSize: 14,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    helper: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: "Inter_400Regular",
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: "Inter_400Regular",
    },
    heading1: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
    heading2: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    heading3: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
  },
} as const;

export type AppTheme = typeof lightTheme;

// Dark theme based on Directus dark mode
export const darkTheme: AppTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: "#6644FF", // Keep primary color consistent
    secondary: "#F0F4F9",

    // Warmer, more reddish error colors for dark theme
    error: "#ff4d6a", // Warmer, more saturated red
    errorBackground: "#331215", // Warmer dark red background
    errorText: "#ff4d6a", // Match error color
    errorBorder: "#471418", // Warmer dark red border

    textPrimary: "#FFFFFF",
    textSecondary: "#C8D5E9",
    textTertiary: "#8196AB",

    background: "#0b0b0b", // Dark background
    backgroundAlt: "#1a1a1a", // Slightly lighter dark
    backgroundDark: "#141414", // Darker shade
    backgroundDarkest: "#000000",
    border: "#2F2F2F",

    textMuted: "#4F5464",

    // Utility colors
    white: "#000000" as string,
    black: "#FFFFFF" as string,
    overlay: "rgba(0, 0, 0, 0.8)",

    success: "#00d691" as string, // Brighter green for dark theme
    successBackground: "#0a2b22" as string, // Dark green background
    successText: "#00d691" as string, // Match success color
    successBorder: "#134237" as string, // Darker green border

    warning: "#ffb74d" as string, // Brighter orange for dark theme
    warningBackground: "#332618" as string, // Dark orange background
    warningText: "#ffb74d" as string, // Match warning color
    warningBorder: "#4d371f" as string, // Darker orange border
  },
};

export const breakpoints = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

declare module "react-native-unistyles" {
  export interface UnistylesThemes {
    light: AppTheme;
    dark: AppTheme;
  }
  export interface UnistylesBreakpoints {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  }
}
