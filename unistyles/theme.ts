import { UnistylesTheme } from "react-native-unistyles";

export const lightTheme = {
  colors: {
    // Main colors
    primary: "#6644FF" as string, // Directus primary purple
    secondary: "#172940" as string, // Dark blue used in secondary elements
    error: "#E35169" as string, // Error red
    success: "#2ECDA7" as string, // Success green
    warning: "#FFB224" as string, // Warning orange

    // Text colors
    textPrimary: "#172940" as string, // Dark text
    textSecondary: "#4F5464" as string, // Secondary text
    textTertiary: "#8196AB" as string, // Lighter text
    textMuted: "#C8D5E9" as string, // Muted text

    // Background colors
    background: "#FFFFFF" as string,
    backgroundAlt: "#F0F4F9" as string, // Light gray background
    backgroundDark: "#e4eaf1" as string,

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

    textPrimary: "#FFFFFF",
    textSecondary: "#C8D5E9",
    textTertiary: "#8196AB",

    background: "#0b0b0b", // Dark background
    backgroundAlt: "#1a1a1a", // Slightly lighter dark
    backgroundDark: "#141414", // Darker shade

    border: "#2F2F2F",

    // Utility colors
    white: "#000000" as string,
    black: "#FFFFFF" as string,
    overlay: "rgba(0, 0, 0, 0.8)",
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
