import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import { Check, X, Palette } from "../icons";
import { Horizontal } from "../layout/Stack";
import { Button } from "../display/button";
import { GestureResponderEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { InterfaceProps } from ".";

type ColorPickerProps = InterfaceProps<{
  value?: string;
  onValueChange?: (color: string) => void;
}>;

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
  item,
  value,
  onValueChange,
  required,
  placeholder = "Select a color",
  disabled = false,
}: ColorPickerProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { styles, theme } = useStyles(colorPickerStyles);
  const { styles: formStyle } = useStyles(formStyles);
  const [draftValue, setDraftValue] = useState<string>(value || "#ff0000");
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [spectrumWidth, setSpectrumWidth] = useState(0);
  const [spectrumHeight, setSpectrumHeight] = useState(0);
  const [hue, setHue] = useState<number>(0);
  const [huePosition, setHuePosition] = useState<number>(0);
  const [alpha, setAlpha] = useState<number>(
    value?.length === 9 ? parseInt(value.slice(7, 9), 16) / 255 : 1
  );

  const spectrumRef = useRef<View>(null);
  const hueRef = useRef<View>(null);

  const [dimensions, setDimensions] = useState<{
    spectrumWidth: number;
    spectrumHeight: number;
    hueWidth: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!spectrumRef.current || !hueRef.current) return;

    const initializePositions = () => {
      spectrumRef.current?.measure((fx, fy, width, height, px, py) => {
        hueRef.current?.measure((hfx, hfy, hueWidth) => {
          setDimensions({
            spectrumWidth: width,
            spectrumHeight: height,
            hueWidth: hueWidth,
          });
        });
      });
    };

    initializePositions();
  }, []);

  useEffect(() => {
    if (!dimensions || !value) return;

    const r = parseInt(value.slice(1, 3), 16) / 255;
    const g = parseInt(value.slice(3, 5), 16) / 255;
    const b = parseInt(value.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    const v = max;

    const s = max === 0 ? 0 : delta / max;

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

    const invertedH = (1 - h) % 1;

    setHuePosition(invertedH * (dimensions.hueWidth - 20));
    setHue(invertedH);

    setPosition({
      x: s * dimensions.spectrumWidth,
      y: (1 - v) * dimensions.spectrumHeight,
    });

    if (value.length === 9) {
      setAlpha(parseInt(value.slice(7, 9), 16) / 255);
    }
  }, [dimensions, value]);

  const handleColorSelect = useCallback(
    (color: string) => {
      setDraftValue(color);

      // Parse RGBA from hex
      const hasAlpha = color.length === 9;
      const r = parseInt(color.slice(1, 3), 16) / 255;
      const g = parseInt(color.slice(3, 5), 16) / 255;
      const b = parseInt(color.slice(5, 7), 16) / 255;
      const a = hasAlpha ? parseInt(color.slice(7, 9), 16) / 255 : 1;

      setAlpha(a);

      // RGB to HSV conversion stays the same
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

      // Invert the hue for position setting
      const invertedH = (1 - h) % 1;

      // Set positions using inverted hue
      setHuePosition(invertedH * spectrumWidth);
      setHue(invertedH);

      setPosition({
        x: s * spectrumWidth,
        y: (1 - v) * spectrumHeight,
      });

      console.log("Color:", color);
      console.log("HSV:", { h, s, v });
      console.log("Mapped Hue:", h);
    },
    [spectrumWidth, spectrumHeight]
  );

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

  const rgbToHex = (r: number, g: number, b: number, a?: number) => {
    const rgb = [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("");

    if (a !== undefined) {
      const alpha = Math.round(a * 255).toString(16);
      return `#${rgb}${alpha.length === 1 ? "0" + alpha : alpha}`;
    }
    return `#${rgb}`;
  };

  const handleSpectrumLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setSpectrumWidth(width);
    setSpectrumHeight(height);
  }, []);

  const handleColorSelection = useCallback(
    (event: any) => {
      if (!spectrumRef.current) return;

      // Get the touch or mouse coordinates
      let pageX, pageY;
      if (event.nativeEvent) {
        // iOS/Android touch events
        const touch = event.nativeEvent.touches?.[0] || event.nativeEvent;
        pageX = touch.pageX;
        pageY = touch.pageY;
      } else {
        // Web mouse events
        pageX = event.clientX;
        pageY = event.clientY;
      }

      // Get element position
      const measureCallback = (
        x: number,
        y: number,
        width: number,
        height: number,
        pageX: number,
        pageY: number
      ) => {
        const relativeX = Math.max(0, Math.min(pageX - x, width));
        const relativeY = Math.max(0, Math.min(pageY - y, height));

        setPosition({
          x: relativeX,
          y: relativeY,
        });

        const saturation = relativeX / width;
        const value = 1 - relativeY / height;
        const rgb = hsvToRgb(1 - hue, saturation, value);
        const hexColor = rgbToHex(rgb.r, rgb.g, rgb.b, alpha);
        setDraftValue(hexColor);
      };

      spectrumRef.current.measure(
        (
          fx: number,
          fy: number,
          width: number,
          height: number,
          px: number,
          py: number
        ) => {
          measureCallback(px, py, width, height, pageX, pageY);
        }
      );
    },
    [hue, alpha]
  );

  const handleHueSelection = useCallback(
    (event: any) => {
      if (!hueRef.current) return;

      // Get the touch or mouse coordinates
      let pageX;
      if (event.nativeEvent) {
        // iOS/Android touch events
        const touch = event.nativeEvent.touches?.[0] || event.nativeEvent;
        pageX = touch.pageX;
      } else {
        // Web mouse events
        pageX = event.clientX;
      }

      // Get element position
      const measureCallback = (x: number, y: number, width: number) => {
        const handleWidth = 20;
        const maxX = width - handleWidth;
        const relativeX = Math.max(0, Math.min(pageX - x, maxX));
        const hueValue = relativeX / maxX;

        setHuePosition(relativeX);
        setHue(hueValue);

        const saturation = position.x / spectrumWidth;
        const value = 1 - position.y / spectrumHeight;
        const rgb = hsvToRgb(1 - hueValue, saturation, value);
        const hexColor = rgbToHex(rgb.r, rgb.g, rgb.b, alpha);
        setDraftValue(hexColor);
      };

      hueRef.current.measure(
        (
          fx: number,
          fy: number,
          width: number,
          height: number,
          px: number,
          py: number
        ) => {
          measureCallback(px, py, width); // Only pass needed parameters
        }
      );
    },
    [position, spectrumWidth, spectrumHeight, alpha]
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
          {required ? " *" : ""}
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
                  {
                    backgroundColor: draftValue || "#000",
                    opacity: alpha,
                  },
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
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                  onResponderGrant={handleHueSelection}
                  onResponderMove={handleHueSelection}
                  onResponderStart={(e: any) => {
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
                <View style={[styles.hueSelector, { left: huePosition }]} />
              </View>
            </View>

            <View
              ref={spectrumRef}
              onLayout={() => {
                if (!dimensions) {
                  spectrumRef.current?.measure(
                    (fx, fy, width, height, px, py) => {
                      hueRef.current?.measure((hfx, hfy, hueWidth) => {
                        setDimensions({
                          spectrumWidth: width,
                          spectrumHeight: height,
                          hueWidth: hueWidth,
                        });
                      });
                    }
                  );
                }
              }}
              style={styles.spectrumContainer}
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
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={handleColorSelection}
                onResponderMove={handleColorSelection}
                {...(Platform.OS === "web"
                  ? {
                      onResponderStart: (e: any) => {
                        handleColorSelection(e);
                        const handleMouseMove = (e: MouseEvent) => {
                          e.preventDefault();
                          handleColorSelection(e);
                        };
                        const handleMouseUp = () => {
                          window.removeEventListener(
                            "mousemove",
                            handleMouseMove
                          );
                          window.removeEventListener("mouseup", handleMouseUp);
                        };
                        window.addEventListener("mousemove", handleMouseMove);
                        window.addEventListener("mouseup", handleMouseUp);
                      },
                    }
                  : {})}
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
                    const newColor = rgbToHex(value, g, b, alpha);
                    handleColorSelect(newColor);
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
                    const newColor = rgbToHex(r, value, b, alpha);
                    handleColorSelect(newColor);
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
                    const newColor = rgbToHex(r, g, value, alpha);
                    handleColorSelect(newColor);
                  }}
                />
              </View>
              {item?.meta?.options?.opacity && (
                <View style={styles.rgbInputGroup}>
                  <Text style={styles.rgbLabel}>A</Text>
                  <TextInput
                    style={styles.rgbInput}
                    keyboardType="numeric"
                    maxLength={3}
                    value={String(Math.round(alpha * 100))}
                    onChangeText={(text) => {
                      const value = Math.min(100, parseInt(text) || 0);
                      const newAlpha = value / 100;
                      setAlpha(newAlpha);
                      const newColor = rgbToHex(r, g, b, newAlpha);
                      handleColorSelect(newColor);
                    }}
                  />
                </View>
              )}
            </View>

            {/* Preset Colors Grid */}
            {item?.meta?.options?.presets && (
              <View style={styles.colorsGrid}>
                {item?.meta?.options?.presets?.map(
                  ({ name, color }: { name: string; color: string }) => (
                    <Pressable
                      key={color}
                      style={[
                        styles.colorButton,
                        {
                          backgroundColor: color,
                          opacity:
                            color.length === 9
                              ? parseInt(color.slice(7, 9), 16) / 255
                              : 1,
                        },
                        draftValue === color && styles.selectedColor,
                      ]}
                      onPress={() => handleColorSelect(color)}
                    />
                  )
                )}
              </View>
            )}

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
  colorButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: theme.borderRadius.sm,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.border,
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
    width: 44,
    height: 44,
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
    marginHorizontal: 10,
  },
  hueBar: {
    position: "absolute",
    left: 0,
    right: 0,
    height: "100%",
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
