import { View, Text } from "react-native";
import { useStyles } from "react-native-unistyles";
import { Pressable } from "react-native";
import { formStyles } from "./style";
import { InterfaceProps } from "./index";

type CheckboxProps = InterfaceProps<{
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  text?: string;
}>;

export const Checkbox = ({
  label,
  error,
  helper,
  checked = false,
  onChange,
  disabled = false,
  text,
  required,
}: CheckboxProps) => {
  const { styles: formStyle, theme } = useStyles(formStyles);
  const caption = text ?? label;

  return (
    <View style={formStyle.formControl}>
      <Pressable
        onPress={() => !disabled && onChange?.(!checked)}
        style={formStyle.checkboxRow}
      >
        <View
          style={[
            formStyle.checkboxContainer,
            {
              width: 20,
              height: 20,
              padding: 0,
              margin: 0,
              justifyContent: "center",
              alignItems: "center",
            },
            error && formStyle.inputError,
            disabled && formStyle.inputDisabled,
          ]}
        >
          {checked && (
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: disabled
                  ? theme.colors.textTertiary
                  : theme.colors.primary,
              }}
            />
          )}
        </View>
        {caption ? (
          <Text
            style={[
              formStyle.checkboxCaption,
              disabled && { color: theme.colors.textTertiary },
            ]}
          >
            {caption}
            {required ? " *" : ""}
          </Text>
        ) : null}
      </Pressable>
      {(error || helper) && (
        <Text style={[formStyle.helperText, error && formStyle.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
};
