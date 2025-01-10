import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import {
  EditorBridge,
  RichText as BaseRichText,
  useEditorBridge,
  Toolbar,
  CoreBridge,
  TenTapStartKit,
} from "@10play/tentap-editor";

interface RichTextProps {
  label?: string;
  error?: string;
  helper?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export const RichText: React.FC<RichTextProps> = ({
  label,
  error,
  helper,
  value,
  onChange,
}) => {
  const { styles } = useStyles(formStyles);
  const editor = useEditorBridge({
    initialContent: value,
    avoidIosKeyboard: true,
    bridgeExtensions: TenTapStartKit,
    dynamicHeight: false,
    theme: {
      toolbar: {
        toolbarBody: {
          backgroundColor: "red",
          height: 100,
        },
      },
    },
    onChange: async () => {
      onChange?.(await editor.getHTML());
    },
  });

  useEffect(() => {
    editor.setContent(value || "");
  }, [value]);

  return (
    <View style={styles.formControl}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Toolbar editor={editor} hidden={false} />

      <BaseRichText style={{ height: 500 }} editor={editor} />

      {(error || helper) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
};
