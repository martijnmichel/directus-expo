import React, { ReactNode, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  TextStyle,
  ViewStyle,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons"; // Assuming you're using Expo
import { formStyles } from "./style";
import { ChevronDown } from "../icons/Chevron";
import { DirectusIcon } from "../display/directus-icon";
import { Checkbox } from "./checkbox";
import { InterfaceProps } from ".";

interface SelectOption {
  text: string;
  value: string | number;
  icon?: string;
  color?: string;
}

type SelectMultiProps = InterfaceProps<{
  options: SelectOption[];
  value?: (string | number)[];
  onValueChange?: (value: (string | number)[]) => void;
}>;

export const SelectMulti = ({
  label,
  error,
  helper,
  options,
  prepend,
  append,
  value = [],
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
  required,
}: SelectMultiProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { styles, theme } = useStyles(selectStyles);
  const { styles: formStyle } = useStyles(formStyles);

  const selectedOptions = options.filter((option) =>
    value?.includes(option.value)
  );

  const clonedPrepend = prepend
    ? React.cloneElement(prepend as React.ReactElement, {
        size: 20,
      })
    : null;

  const clonedAppend = append
    ? React.cloneElement(append as React.ReactElement, {
        size: 20,
        marginLeft: "auto",
      })
    : null;

  return (
    <View style={formStyle.formControl}>
      {label && (
        <Text
          style={[
            formStyle.label,
            disabled && { color: theme.colors.textTertiary },
          ]}
        >
          {label} {required && "*"}
        </Text>
      )}

      <Pressable
        style={[
          styles.selectButton,
          formStyle.inputContainer,
          error && formStyle.inputError,
          disabled && formStyle.inputDisabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled || !options.length}
      >
        {clonedPrepend}
        <Text
          style={[
            styles.selectText,
            !selectedOptions.length && styles.placeholder,
            disabled && { color: theme.colors.textTertiary },
          ]}
        >
          {selectedOptions.length
            ? selectedOptions.map((o) => o.text).join(", ")
            : placeholder}
        </Text>
        <View
          style={{
            marginLeft: "auto",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.xs,
          }}
        >
          {clonedAppend}
          <ChevronDown
            size={20}
            color={
              disabled ? theme.colors.textTertiary : theme.colors.textSecondary
            }
          />
        </View>
      </Pressable>

      {(error || helper) && (
        <Text style={[formStyle.helperText, error && formStyle.errorText]}>
          {error || helper}
        </Text>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value?.toString() || "null"}
              renderItem={({ item, index }) => (
                <Pressable
                  style={[
                    styles.option,
                    index === options.length - 1 && styles.lastOption,
                  ]}
                  onPress={() => {
                    const isSelected = value.includes(item.value);
                    const newValue = isSelected
                      ? value.filter((v) => v !== item.value)
                      : [...value, item.value];
                    onValueChange?.(newValue);
                  }}
                >
                  <Checkbox
                    checked={value.includes(item.value)}
                    onChange={() => {
                      const isSelected = value.includes(item.value);
                      const newValue = isSelected
                        ? value.filter((v) => v !== item.value)
                        : [...value, item.value];
                      onValueChange?.(newValue);
                    }}
                    disabled={disabled}
                  />
                  {item.icon && (
                    <View style={styles.optionIcon}>
                      <DirectusIcon
                        name={item.icon as any}
                        size={20}
                        color={item.color || theme.colors.textPrimary}
                      />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.optionText,
                      value.includes(item.value) && styles.selectedOptionText,
                      item.color && { color: item.color },
                    ]}
                  >
                    {item.text}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const selectStyles = createStyleSheet((theme) => ({
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    height: 44,
  },
  selectText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  placeholder: {
    color: theme.colors.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    maxHeight: "80%",
    width: "90%",
    maxWidth: 500,
    marginHorizontal: "auto",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  optionText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: "500",
  },
  optionIcon: {
    width: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
}));
