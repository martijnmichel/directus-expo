import React, { useState } from "react";
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

interface SelectOption {
  text: string;
  value: string | number;
}

interface SelectProps {
  label?: string;
  error?: string;
  helper?: string;
  options: SelectOption[];
  value?: string | number;
  onValueChange?: (value: string | number) => void;
  placeholder?: string;
}

export const Select = ({
  label,
  error,
  helper,
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
}: SelectProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { styles, theme } = useStyles(selectStyles);
  const { styles: formStyle } = useStyles(formStyles);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <View style={formStyle.formControl}>
      {label && <Text style={formStyle.label}>{label}</Text>}

      <Pressable
        style={[styles.selectButton, error && formStyle.inputError]}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[styles.selectText, !selectedOption && styles.placeholder]}
        >
          {selectedOption ? selectedOption.value : placeholder}
        </Text>
        <ChevronDown />
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
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onValueChange?.(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.selectedOptionText,
                    ]}
                  >
                    {item.value}
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
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    minHeight: 48,
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
  },
  option: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  optionText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: "500",
  },
}));
