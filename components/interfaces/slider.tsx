import React from "react";
import {
  View,
  Text,
  PanResponder,
  Animated,
  LayoutChangeEvent,
  PanResponderGestureState,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import { InterfaceProps } from ".";

type SliderProps = InterfaceProps<{
  value: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}>;

export const Slider: React.FC<SliderProps> = ({
  label,
  error,
  helper,
  value,
  disabled = false,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  required,
}) => {
  const { styles, theme } = useStyles(sliderStyles);
  const [sliderWidth, setSliderWidth] = React.useState(0);
  const [sliderX, setSliderX] = React.useState(0);
  const position = React.useRef(new Animated.Value(0)).current;
  const sliderRef = React.useRef<View>(null);

  // Calculate the initial position
  React.useEffect(() => {
    if (!sliderRef.current) return;

    sliderRef.current.measure((fx, fy, width, height, px, py) => {
      const maxWidth = width - 20; // Account for handle width
      const percentage = ((value - min) / (max - min)) * 100;
      const boundedPosition = Math.max(
        0,
        Math.min((percentage / 100) * maxWidth, maxWidth)
      );
      position.setValue(boundedPosition);
    });
  }, [value, min, max, sliderWidth]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, x } = event.nativeEvent.layout;
    console.log("onLayout:", { width, x });
    setSliderWidth(width);
    setSliderX(x);
  };

  const onDrag = (_: any, gestureState: PanResponderGestureState) => {
    if (!sliderRef.current) return;

    sliderRef.current.measure((fx, fy, width, height, px, py) => {
      // Subtract handle width (20px from styles) to prevent overflow
      const maxWidth = width - 20;
      let newX = gestureState.moveX - px;
      newX = Math.max(0, Math.min(newX, maxWidth));
      position.setValue(newX);

      // Calculate value based on position using maxWidth
      const percentage = (newX / maxWidth) * 100;
      const newValue = min + ((max - min) * percentage) / 100;
      const steppedValue = Math.round(newValue / step) * step;
      const clampedValue = Math.min(max, Math.max(min, steppedValue));
      onChange?.(clampedValue);
    });
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (event) => {
        if (!sliderRef.current) return;

        sliderRef.current.measure((fx, fy, width, height, px, py) => {
          const maxWidth = width - 20;
          let newX = event.nativeEvent.pageX - px;
          newX = Math.max(0, Math.min(newX, maxWidth));
          position.setValue(newX);

          const percentage = (newX / maxWidth) * 100;
          const newValue = min + ((max - min) * percentage) / 100;
          const steppedValue = Math.round(newValue / step) * step;
          const clampedValue = Math.min(max, Math.max(min, steppedValue));
          onChange?.(clampedValue);
        });
      },
      onPanResponderMove: onDrag,
    })
  ).current;

  return (
    <View style={styles.formControl}>
      {label && (
        <Text style={styles.label}>
          {label} {required && "*"}
        </Text>
      )}
      <View
        ref={sliderRef}
        {...panResponder.panHandlers}
        style={[
          styles.sliderContainer,
          error && styles.sliderError,
          disabled && styles.sliderDisabled,
        ]}
        onLayout={onLayout}
      >
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.progress,
              {
                width: position,
              },
            ]}
          />
        </View>
        <Animated.View
          style={[
            styles.handle,
            {
              transform: [
                { translateX: position },
                { translateX: -10 }, // Offset by half the handle width (20/2)
              ],
            },
          ]}
        />
      </View>
      {(error || helper) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
};

const sliderStyles = createStyleSheet((theme) => ({
  ...formStyles(theme),
  sliderContainer: {
    height: 44,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
  },
  sliderError: {
    borderColor: theme.colors.error,
  },
  sliderDisabled: {
    backgroundColor: theme.colors.backgroundAlt,
  },
  track: {
    height: 4,
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.full,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    backgroundColor: theme.colors.primary,
  },
  handle: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}));
