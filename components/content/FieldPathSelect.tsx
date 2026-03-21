import { Text, Muted } from "@/components/display/typography";
import { Button } from "@/components/display/button";
import { DirectusIcon } from "@/components/display/directus-icon";
import { Vertical } from "@/components/layout/Stack";
import { formStyles } from "@/components/interfaces/style";
import type { ReactNode } from "react";
import {
  Pressable,
  Text as RNText,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useStyles } from "react-native-unistyles";

export function FieldPathSelect({
  label,
  info,
  value,
  placeholder,
  onPress,
  onClear,
  style,
}: {
  label?: ReactNode;
  /** Helper text below the field (e.g. slot hint). */
  info?: ReactNode;
  value: string;
  placeholder: string;
  onPress: () => void;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { styles, theme } = useStyles(formStyles);
  const display = String(value ?? "").trim();
  const hasValue = display.length > 0;
  const showClearButton = hasValue && onClear != null;

  return (
    <Vertical spacing="xs" style={style}>
      {label != null && label !== "" ? (
        <Text numberOfLines={1} style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View style={styles.inputContainer}>
        <Pressable
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 44,
            justifyContent: "center",
            paddingHorizontal: theme.spacing.md,
          }}
          onPress={onPress}
        >
          <RNText
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              ...theme.typography.body,
              color: hasValue
                ? theme.colors.textPrimary
                : theme.colors.textSecondary,
            }}
          >
            {hasValue ? display : placeholder}
          </RNText>
        </Pressable>
        {showClearButton ? (
          <View style={styles.append}>
            <Button
              variant="ghost"
              size="sm"
              colorScheme="error"
              onPress={onClear}
            >
              <DirectusIcon name="close" />
            </Button>
          </View>
        ) : null}
      </View>

      {info != null && info !== "" ? (
        <Muted numberOfLines={2}>{info}</Muted>
      ) : null}
    </Vertical>
  );
}
