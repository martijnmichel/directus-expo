import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import { Check, X, Palette } from "../icons";
import { Horizontal } from "../layout/Stack";
import { Button } from "../display/button";
import { GestureResponderEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ColorPickerProps {
  label?: string;
  error?: string;
  helper?: string;
  value?: string;
  onValueChange?: (color: string) => void;
  placeholder?: string;
  disabled?: boolean;
  presets?: Array<{ name: string; color: string }>;
  opacity?: boolean;
}

const DEFAULT_COLORS = [
  { name: "Primary", color: "#6644FF" },
  { name: "Secondary", color: "#172940" },
  { name: "Error", color: "#E35169" },
  { name: "Success", color: "#2ECDA7" },
  { name: "Warning", color: "#FFB224" },
  { name: "Text Secondary", color: "#4F5464" },
  { name: "Text Tertiary", color: "#8196AB" },
  { name: "Background Alt", color: "#F0F4F9" },
  { name: "White", color: "#FFFFFF" },
  { name: "Black", color: "#000000" },
  { name: "Text Muted", color: "#C8D5E9" },
  { name: "Border", color: "#e4eaf1" },
];

export const ColorPicker = ({
  label,
  error,
  helper,
  value,
  onValueChange,
  placeholder = "Select a color",
  disabled = false,
  presets = DEFAULT_COLORS,
  opacity = false,
}: ColorPickerProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { styles, theme } = useStyles(colorPickerStyles);
  const { styles: formStyle } = useStyles(formStyles);
  const [draftValue, setDraftValue] = useState<string | undefined>(value);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [spectrumWidth, setSpectrumWidth] = useState(0);
  const [spectrumHeight, setSpectrumHeight] = useState(0);
  const [hue, setHue] = useState(0);
  const [huePosition, setHuePosition] = useState(0);

  const spectrumRef = useRef<View>(null);
  const hueRef = useRef<View>(null);

  const handleColorSelect = (color: string) => {
    setDraftValue(color);

    // RGB to HSV conversion stays the same
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;

    // Convert RGB to HSV
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    // Calculate Value
    const v = max;

    // Calculate Saturation
    const s = max === 0 ? 0 : delta / max;

    // Calculate Hue
    let h;
    if (delta === 0) {
      h = 0;
    } else if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }

    h = h / 6;
    if (h < 0) h += 1;

    // Normal position for hue handle
    setHuePosition(h * spectrumWidth);

    // Use the same hue for spectrum
    setHue(h);

    setPosition({
      x: s * spectrumWidth,
      y: (1 - v) * spectrumHeight,
    });

    console.log("Color:", color);
    console.log("HSV:", { h, s, v });
    console.log("Mapped Hue:", h);
  };

  const handleConfirm = () => {
    onValueChange?.(draftValue!);
    setModalVisible(false);
  };

  const hsvToRgb = (h: number, s: number, v: number) => {
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
      default:
        r = 0;
        g = 0;
        b = 0;
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  };

  const handleSpectrumLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setSpectrumWidth(width);
    setSpectrumHeight(height);
  }, []);

  const handleColorSelection = useCallback(
    (event: MouseEvent | GestureResponderEvent | any) => {
      if (!spectrumRef.current) return;

      // @ts-ignore - getBoundingClientRect is available on web
      const rect = spectrumRef.current.getBoundingClientRect?.() || {
        left: 0,
        top: 0,
      };
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;

      const x = Math.max(0, Math.min(clientX - rect.left, spectrumWidth));
      const y = Math.max(0, Math.min(clientY - rect.top, spectrumHeight));

      setPosition({ x, y });

      const saturation = x / spectrumWidth;
      const value = 1 - y / spectrumHeight;

      const finalHue = (1 - hue) % 1;
      const rgb = hsvToRgb(finalHue, saturation, value);
      const hexColor = rgbToHex(rgb.r, rgb.g, rgb.b);
      setDraftValue(hexColor);
    },
    [spectrumWidth, spectrumHeight, hue]
  );

  const handleHueSelection = useCallback(
    (event: MouseEvent | GestureResponderEvent | any) => {
      if (!hueRef.current) return;

      // @ts-ignore - getBoundingClientRect is available on web
      const rect = hueRef.current.getBoundingClientRect?.() || {
        left: 0,
        top: 0,
      };
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;

      const x = Math.max(0, Math.min(clientX - rect.left, spectrumWidth));
      setHuePosition(x);
      const newHue = x / spectrumWidth;
      setHue(newHue);

      const saturation = position.x / spectrumWidth;
      const value = 1 - position.y / spectrumHeight;
      const finalHue = (1 - newHue) % 1;
      const rgb = hsvToRgb(finalHue, saturation, value);
      const hexColor = rgbToHex(rgb.r, rgb.g, rgb.b);
      setDraftValue(hexColor);
    },
    [spectrumWidth, position.x, position.y, spectrumHeight]
  );

  const [r, g, b] = draftValue
    ? [
        parseInt(draftValue.slice(1, 3), 16),
        parseInt(draftValue.slice(3, 5), 16),
        parseInt(draftValue.slice(5, 7), 16),
      ]
    : [0, 0, 0];

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
        onPress={() => {
          !disabled && setModalVisible(true);
          if (value) handleColorSelect(value);
        }}
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

            {/* Color Spectrum */}
            <View style={styles.previewSection}>
              <View
                style={[
                  styles.previewCircle,
                  { backgroundColor: draftValue || "#000" },
                ]}
              />
              <View
                ref={hueRef}
                style={styles.hueBarContainer}
                onLayout={handleSpectrumLayout}
              >
                <LinearGradient
                  style={styles.hueBar}
                  colors={[
                    "#FF0000", // Red
                    "#FF00FF", // Pink/Magenta
                    "#0000FF", // Blue
                    "#00FFFF", // Cyan
                    "#00FF00", // Green
                    "#FFFF00", // Yellow
                    "#FF8800", // Orange
                    "#FF0000", // Red (complete the circle)
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onTouchStart={handleHueSelection}
                  onTouchMove={handleHueSelection}
                  onMouseDown={(e: any) => {
                    handleHueSelection(e);
                    const handleMouseMove = (e: MouseEvent) => {
                      e.preventDefault();
                      handleHueSelection(e);
                    };
                    const handleMouseUp = () => {
                      window.removeEventListener("mousemove", handleMouseMove);
                      window.removeEventListener("mouseup", handleMouseUp);
                    };
                    window.addEventListener("mousemove", handleMouseMove);
                    window.addEventListener("mouseup", handleMouseUp);
                  }}
                />
                <View
                  style={[styles.hueSelector, { left: huePosition - 10 }]}
                />
              </View>
            </View>

            <View
              ref={spectrumRef}
              style={styles.spectrumContainer}
              onLayout={handleSpectrumLayout}
            >
              <LinearGradient
                style={StyleSheet.absoluteFill}
                colors={[
                  "#FFF",
                  `hsl(${Math.round((1 - hue) * 360)}, 100%, 50%)`,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <LinearGradient
                  style={StyleSheet.absoluteFill}
                  colors={["rgba(0,0,0,0)", "#000"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
              </LinearGradient>
              <Pressable
                style={StyleSheet.absoluteFill}
                onTouchStart={handleColorSelection}
                onTouchMove={handleColorSelection}
                onMouseDown={(e: any) => {
                  handleColorSelection(e);
                  const handleMouseMove = (e: MouseEvent) => {
                    e.preventDefault();
                    handleColorSelection(e);
                  };
                  const handleMouseUp = () => {
                    window.removeEventListener("mousemove", handleMouseMove);
                    window.removeEventListener("mouseup", handleMouseUp);
                  };
                  window.addEventListener("mousemove", handleMouseMove);
                  window.addEventListener("mouseup", handleMouseUp);
                }}
              />
              <View
                style={[
                  styles.spectrumSelector,
                  {
                    left: position.x - 10,
                    top: position.y - 10,
                  },
                ]}
              />
            </View>

            {/* RGB Inputs */}
            <View style={styles.rgbContainer}>
              <View style={styles.rgbInputGroup}>
                <Text style={styles.rgbLabel}>R</Text>
                <TextInput
                  style={styles.rgbInput}
                  keyboardType="numeric"
                  maxLength={3}
                  value={String(r)}
                  onChangeText={(text) => {
                    const value = Math.min(255, parseInt(text) || 0);
                    const newColor = rgbToHex(value, g, b);
                    setDraftValue(newColor);
                  }}
                />
              </View>
              <View style={styles.rgbInputGroup}>
                <Text style={styles.rgbLabel}>G</Text>
                <TextInput
                  style={styles.rgbInput}
                  keyboardType="numeric"
                  maxLength={3}
                  value={String(g)}
                  onChangeText={(text) => {
                    const value = Math.min(255, parseInt(text) || 0);
                    const newColor = rgbToHex(r, value, b);
                    setDraftValue(newColor);
                  }}
                />
              </View>
              <View style={styles.rgbInputGroup}>
                <Text style={styles.rgbLabel}>B</Text>
                <TextInput
                  style={styles.rgbInput}
                  keyboardType="numeric"
                  maxLength={3}
                  value={String(b)}
                  onChangeText={(text) => {
                    const value = Math.min(255, parseInt(text) || 0);
                    const newColor = rgbToHex(r, g, value);
                    setDraftValue(newColor);
                  }}
                />
              </View>
              {opacity && (
                <View style={styles.rgbInputGroup}>
                  <Text style={styles.rgbLabel}>A</Text>
                  <TextInput
                    style={styles.rgbInput}
                    keyboardType="numeric"
                    maxLength={3}
                    value="100"
                    onChangeText={(text) => {
                      const value = Math.min(100, parseInt(text) || 0);
                      // Handle alpha value
                    }}
                  />
                </View>
              )}
            </View>

            {/* Preset Colors Grid */}
            <View style={styles.colorsGrid}>
              {presets.map(({ name, color }) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    draftValue === color && styles.selectedColor,
                  ]}
                  onPress={() => handleColorSelect(color)}
                >
                  <View style={styles.colorButtonContent}>
                    <View style={styles.colorSwatch} />
                  </View>
                </Pressable>
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
  previewSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  previewCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.border,
  },
  hueBarContainer: {
    flex: 1,
    height: 20,
    borderRadius: theme.borderRadius.sm,
    overflow: "hidden",
    position: "relative",
  },
  hueBar: {
    height: "100%",
    width: "100%",
  },
  hueSelector: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    top: 0,
    marginTop: -10,
  },
  rgbContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  rgbInputGroup: {
    flex: 1,
  },
  rgbLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  rgbInput: {
    ...theme.typography.body,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    textAlign: "center",
  },
  spectrumContainer: {
    height: 200,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  spectrumSelector: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}));
