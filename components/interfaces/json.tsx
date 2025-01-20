import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  TextInput,
  Text,
  ScrollView,
  TextInputProps,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import { InterfaceProps } from ".";

export const JsonInput = React.forwardRef<
  TextInput,
  InterfaceProps<TextInputProps, string>
>(
  (
    { label, error, helper, value, onChange, style, disabled, ...props },
    ref
  ) => {
    const { styles, theme } = useStyles(jsonStyles);
    const [lines, setLines] = useState<number[]>([1]);
    const [errorLine, setErrorLine] = useState<number | null>(null);

    useEffect(() => {
      if (!value || typeof value !== "string") {
        return;
      }
      const lineCount = !!value
        ? ((value || "")?.match(/\n/g)?.length || 0) + 1
        : 0;
      if (lineCount)
        setLines(Array.from({ length: lineCount }, (_, i) => i + 1));
    }, [value]);

    const handleChange = useCallback(
      (text: string) => {
        onChange?.(text);
        try {
          JSON.parse(text);
          setErrorLine(null);
        } catch (e: any) {
          const lineMatch = e.message.match(/line (\d+)/);
          setErrorLine(lineMatch ? parseInt(lineMatch[1]) : null);
        }
      },
      [onChange]
    );

    const handleBlur = useCallback(() => {
      try {
        const parsed = JSON.parse(value || "");
        const formatted = JSON.stringify(parsed, null, 2);
        if (formatted !== value) {
          onChange?.(formatted);
        }
      } catch (e) {
        // Keep invalid JSON as-is
      }
    }, [value, onChange]);

    const renderLines = () => {
      return lines.map((num) => (
        <View
          key={num}
          style={[
            styles.lineNumberContainer,
            errorLine === num && styles.errorLineIndicator,
          ]}
        >
          <Text style={styles.lineNumber}>{num}</Text>
        </View>
      ));
    };

    return (
      <View style={styles.formControl}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.container,
            error && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
        >
          <ScrollView
            style={styles.lineNumbers}
            showsVerticalScrollIndicator={false}
          >
            {renderLines()}
          </ScrollView>
          <TextInput
            ref={ref}
            multiline
            value={value}
            onChangeText={handleChange}
            onBlur={handleBlur}
            style={[styles.input, style]}
            placeholderTextColor={theme.colors.textTertiary}
            editable={!disabled}
            {...props}
          />
        </View>
        {(error || helper) && (
          <Text style={[styles.helperText, error && styles.errorText]}>
            {error || helper}
          </Text>
        )}
      </View>
    );
  }
);

const jsonStyles = createStyleSheet((theme) => ({
  ...formStyles(theme),
  container: {
    flexDirection: "row",
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    overflow: "hidden",
  },
  lineNumbers: {
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.backgroundAlt,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    width: 44,
  },
  lineNumberContainer: {
    paddingHorizontal: theme.spacing.sm,
    height: theme.typography.body.lineHeight,
    justifyContent: "center",
    width: 44,
  },
  lineNumber: {
    color: theme.colors.textTertiary,
    fontSize: theme.typography.body.fontSize,
    fontFamily: theme.typography.body.fontFamily,
    textAlign: "right",
  },
  errorLineIndicator: {
    backgroundColor: `${theme.colors.error}20`,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.error,
  },
  input: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    fontFamily: "monospace",
    width: "100%",
  },
}));
