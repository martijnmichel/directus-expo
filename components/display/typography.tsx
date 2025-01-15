import React from "react";
import { Text as RNText, TextProps } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

interface TypographyProps extends TextProps {
  children: React.ReactNode;
  centered?: boolean;
}

export const H1 = ({
  children,
  centered,
  style,
  ...props
}: TypographyProps) => {
  const { styles } = useStyles(stylesheet);
  return (
    <RNText style={[styles.h1, centered && styles.centered, style]} {...props}>
      {children}
    </RNText>
  );
};

export const H2 = ({
  children,
  centered,
  style,
  ...props
}: TypographyProps) => {
  const { styles } = useStyles(stylesheet);
  return (
    <RNText style={[styles.h2, centered && styles.centered, style]} {...props}>
      {children}
    </RNText>
  );
};

export const H3 = ({
  children,
  centered,
  style,
  ...props
}: TypographyProps) => {
  const { styles } = useStyles(stylesheet);
  return (
    <RNText style={[styles.h3, centered && styles.centered, style]} {...props}>
      {children}
    </RNText>
  );
};

export const Text = ({
  children,
  centered,
  style,
  ...props
}: TypographyProps) => {
  const { styles } = useStyles(stylesheet);
  return (
    <RNText
      style={[styles.text, centered && styles.centered, style]}
      {...props}
    >
      {children}
    </RNText>
  );
};

export const Subtitle = ({
  children,
  centered,
  style,
  ...props
}: TypographyProps) => {
  const { styles } = useStyles(stylesheet);
  return (
    <RNText
      style={[styles.subtitle, centered && styles.centered, style]}
      {...props}
    >
      {children}
    </RNText>
  );
};

export const Description = ({
  children,
  centered,
  style,
  ...props
}: TypographyProps) => {
  const { styles } = useStyles(stylesheet);
  return (
    <RNText
      style={[styles.description, centered && styles.centered, style]}
      {...props}
    >
      {children}
    </RNText>
  );
};

export const Muted = ({
  children,
  centered,
  style,
  ...props
}: TypographyProps) => {
  const { styles } = useStyles(stylesheet);
  return (
    <RNText
      style={[styles.muted, centered && styles.centered, style]}
      {...props}
    >
      {children}
    </RNText>
  );
};

const stylesheet = createStyleSheet((theme) => ({
  h1: {
    fontSize: theme.typography.heading1.fontSize,
    lineHeight: theme.typography.heading1.lineHeight,
    fontWeight: theme.typography.heading1.fontWeight,
    fontFamily: theme.typography.heading1.fontFamily,
    color: theme.colors.textPrimary,
  },
  h2: {
    fontSize: theme.typography.heading2.fontSize,
    lineHeight: theme.typography.heading2.lineHeight,
    fontWeight: theme.typography.heading2.fontWeight,
    fontFamily: theme.typography.heading2.fontFamily,
    color: theme.colors.textPrimary,
  },
  h3: {
    fontSize: theme.typography.heading3.fontSize,
    lineHeight: theme.typography.heading3.lineHeight,
    fontWeight: theme.typography.heading3.fontWeight,
    fontFamily: theme.typography.heading3.fontFamily,
    color: theme.colors.textPrimary,
  },
  text: {
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize + 2,
    lineHeight: theme.typography.body.lineHeight + 4,
    color: theme.colors.textSecondary,
    fontWeight: "500",
    fontFamily: theme.typography.body.fontFamily,
  },
  description: {
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
  },
  muted: {
    fontSize: theme.typography.helper.fontSize,
    lineHeight: theme.typography.helper.lineHeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textTertiary,
  },
  centered: {
    textAlign: "center",
  },
}));
