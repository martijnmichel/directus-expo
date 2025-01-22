import React, { ReactNode, useState } from "react";
import { View, TextInput, TextInputProps, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import { Horizontal } from "../layout/Stack";
import { filter, map, orderBy } from "lodash";
import { Tag } from "../display/tag";

interface TagsProps extends Omit<TextInputProps, "onChange" | "value"> {
  label?: string;
  error?: string;
  prepend?: ReactNode;
  append?: ReactNode;
  helper?: string;
  disabled?: boolean;
  value: string[];
  onChange: (value: string[]) => void;
  sortByAlphabet?: boolean;
  presets?: string[];
}

export const TagsInput = React.forwardRef<TextInput, TagsProps>(
  (
    {
      label,
      error,
      prepend,
      append,
      helper,
      style,
      disabled,
      value,
      presets,
      sortByAlphabet,
      onChange,
    },
    ref
  ) => {
    const [localValue, setLocalValue] = useState("");
    const { styles, theme } = useStyles(formStyles);

    // Default to error color if there's an error, otherwise use the theme's text color
    const defaultIconColor = error
      ? theme.colors.error
      : theme.colors.textSecondary;

    const finalIconColor = defaultIconColor;

    const clonedPrepend = prepend
      ? React.cloneElement(prepend as React.ReactElement, {
          color: finalIconColor,
          size: 20,
        })
      : null;

    const clonedAppend = append
      ? React.cloneElement(append as React.ReactElement, {
          color: finalIconColor,
          size: 20,
        })
      : null;

    return (
      <View style={styles.formControl}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.inputContainer,
            error && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
        >
          {prepend && <View style={styles.prepend}>{clonedPrepend}</View>}
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor="#A0A0A0"
            editable={!disabled}
            onChangeText={setLocalValue}
            value={localValue}
            onKeyPress={(e) => {
              if (e.nativeEvent.key === ",") {
                e.preventDefault();
                const trimmedValue = localValue.trim();
                if (trimmedValue) {
                  onChange([...value, trimmedValue]);
                  setLocalValue("");
                }
              }
            }}
            onSubmitEditing={() => {
              const trimmedValue = localValue.trim();
              if (trimmedValue) {
                onChange([...value, trimmedValue]);
                setLocalValue("");
              }
            }}
          />
          {append && <View style={styles.append}>{clonedAppend}</View>}
        </View>
        {(error || helper) && (
          <Text style={[styles.helperText, error && styles.errorText]}>
            {error || helper}
          </Text>
        )}

        <Horizontal style={{ flexWrap: "wrap" }}>
          {map(
            filter(presets || [], (tag) => !value?.includes(tag)),
            (tag) => (
              <Tag
                onPress={() => {
                  onChange([...value, tag]);
                }}
                key={tag}
              >
                {tag}
              </Tag>
            )
          )}
          {map(
            sortByAlphabet
              ? orderBy(value || [], (tag) => tag.toLowerCase())
              : value || [],
            (tag) => (
              <Tag
                onPress={() => {
                  onChange(value.filter((t) => t !== tag));
                }}
                isSelected={true}
                key={tag}
              >
                {tag}
              </Tag>
            )
          )}
        </Horizontal>
      </View>
    );
  }
);
