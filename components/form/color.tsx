import React, { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import { Check, X, Palette } from "../icons";
import { Horizontal } from "../layout/Stack";
import { Button } from "../display/button";

interface ColorPickerProps {
  label?: string;
  error?: string;
  helper?: string;
  value?: string;
  onValueChange?: (color: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const DEFAULT_COLORS = [
  "#6644FF", // Primary
  "#172940", // Secondary
  "#E35169", // Error
  "#2ECDA7", // Success
  "#FFB224", // Warning
  "#4F5464", // Text Secondary
  "#8196AB", // Text Tertiary
  "#F0F4F9", // Background Alt
  "#FFFFFF", // White
  "#000000", // Black
  "#C8D5E9", // Text Muted
  "#e4eaf1", // Border
];

export const ColorPicker = ({
  label,
  error,
  helper,
  value,
  onValueChange,
  placeholder = "Select a color",
  disabled = false,
}: ColorPickerProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { styles, theme } = useStyles(colorPickerStyles);
  const { styles: formStyle } = useStyles(formStyles);
  const [draftValue, setDraftValue] = useState<string | undefined>(value);

  const handleColorSelect = (color: string) => {
    setDraftValue(color);
  };

  const handleConfirm = () => {
    onValueChange?.(draftValue!);
    setModalVisible(false);
  };

  return (
    <View style={formStyle.formControl}>
      {label && (
        <Text
          style={[
            formStyle.label,
            disabled && { color: theme.colors.textTertiary },
          ]}
        >
          {label}
          {label.endsWith("*") ? "" : " *"}
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
        disabled={disabled}
      >
        <View style={styles.colorPreviewContainer}>
          {value && (
            <View style={[styles.colorPreview, { backgroundColor: value }]} />
          )}
          <Text
            style={[
              styles.selectText,
              !value && styles.placeholder,
              disabled && { color: theme.colors.textTertiary },
            ]}
          >
            {value || placeholder}
          </Text>
        </View>
        <View style={{ marginLeft: "auto" }}>
          <Palette
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
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Select Color</Text>
            <View style={styles.colorsGrid}>
              {DEFAULT_COLORS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    draftValue === color && styles.selectedColor,
                  ]}
                  onPress={() => handleColorSelect(color)}
                />
              ))}
            </View>

            <Horizontal style={{ justifyContent: "flex-end", marginTop: 16 }}>
              <Button
                rounded
                variant="soft"
                onPress={() => setModalVisible(false)}
              >
                <X />
              </Button>
              <Button rounded onPress={handleConfirm} disabled={!draftValue}>
                <Check />
              </Button>
            </Horizontal>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const colorPickerStyles = createStyleSheet((theme) => ({
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
  colorPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: theme.borderRadius.sm,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.border,
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
    padding: theme.spacing.lg,
    width: "90%",
    maxWidth: 400,
    marginHorizontal: "auto",
  },
  modalTitle: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  colorsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    justifyContent: "flex-start",
    marginBottom: theme.spacing.lg,
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.border,
  },
  selectedColor: {
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.primary,
  },
}));
