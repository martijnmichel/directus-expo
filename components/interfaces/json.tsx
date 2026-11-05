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

import { InterfaceProps } from "./index";

type JsonValue = string | object | null;
type JsonInputProps = Omit<InterfaceProps<TextInputProps>, "value" | "onChangeText"> & {
  value?: JsonValue;
  onChangeText?: (value: JsonValue) => void;
};

export const JsonInput = React.forwardRef<TextInput, JsonInputProps>(
  (
    {
      label,
      error,
      helper,
      value: valueProp,
      onChangeText,
      style,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const { styles, theme } = useStyles(jsonStyles);
    const [lines, setLines] = useState<number[]>([1]);
    const [errorLine, setErrorLine] = useState<number | null>(null);
    const [draft, setDraft] = useState<string | null>(null);

    const value =
      draft !== null
        ? draft
        : valueProp == null || valueProp === ""
          ? ""
          : typeof valueProp === "string"
            ? valueProp
            : JSON.stringify(valueProp, null, 2);

    useEffect(() => {
      setDraft(null);
    }, [valueProp]);

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

    const emitValue = useCallback(
      (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) {
          onChangeText?.(null);
          return;
        }
        try {
          onChangeText?.(JSON.parse(text));
          setErrorLine(null);
        } catch (e: any) {
          onChangeText?.(text);
          const lineMatch = e.message?.match?.(/line (\d+)/);
          setErrorLine(lineMatch ? parseInt(lineMatch[1]) : null);
        }
      },
      [onChangeText]
    );

    const handleChange = useCallback(
      (text: string) => {
        setDraft(text);
        emitValue(text);
      },
      [emitValue]
    );

    const handleBlur = useCallback(() => {
      const trimmed = value.trim();
      if (!trimmed) {
        setDraft(null);
        onChangeText?.(null);
        setErrorLine(null);
        return;
      }
      try {
        const parsed = JSON.parse(value);
        setDraft(null);
        onChangeText?.(parsed);
        setErrorLine(null);
      } catch {
        // Keep invalid JSON as-is
      }
    }, [value, onChangeText]);

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
        {label && (
          <Text style={styles.label}>
            {label} {required && "*"}
          </Text>
        )}
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
    width: 32,
    maxWidth: 32,
  },
  lineNumberContainer: {
    paddingHorizontal: theme.spacing.sm,
    height: theme.typography.body.lineHeight,
    justifyContent: "center",
    width: 32,
  },
  lineNumber: {
    color: theme.colors.textTertiary,
    fontSize: theme.typography.body.fontSize,
    fontFamily: theme.typography.monospace.fontFamily,
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
    fontFamily: theme.typography.monospace.fontFamily,
    width: "100%",
  },
}));
