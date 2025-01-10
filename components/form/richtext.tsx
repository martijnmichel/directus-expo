import React, { useEffect } from "react";
import { View, Text, Platform } from "react-native";
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

const customEditorCSS = `
.ProseMirror {
  padding: 12px;
  min-height: 150px;
  color: inherit;
  font-size: inherit;
  line-height: inherit;
  outline: none;
}

.ProseMirror p {
  margin: 0;
  line-height: 1.5;
}

.tiptap-editor {
  height: 300px;
}

.tiptap-toolbar {
  background-color: #F0F4F9;
  border-bottom: 1px solid #D3DAE4;
  padding: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tiptap-toolbar button {
  padding: 8px;
  border-radius: 4px;
  background: transparent;
  border: none;
  color: #4F5464;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tiptap-toolbar button.is-active {
  background-color: #FFFFFF;
  color: #6644FF;
}

.tiptap-toolbar button:hover {
  background-color: rgba(255, 255, 255, 0.5);
}
`;

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
    avoidIosKeyboard: Platform.OS === "ios",

    bridgeExtensions: [...TenTapStartKit],
    dynamicHeight: false,
    theme: {
      toolbar: {},
      webview: {
        height: 300,
      },
      webviewContainer: {
        height: 300,
      },
    },
    onChange: async () => {
      const html = await editor.getHTML();
      onChange?.(html);
    },
  });

  useEffect(() => {
    if (value !== undefined) {
      editor.setContent(value);
    }
  }, [value]);

  return (
    <View style={styles.formControl}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[{ height: 300 }, error && styles.inputError]}>
        <Toolbar editor={editor} hidden={false} />
        <BaseRichText editor={editor} />
      </View>
      {(error || helper) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
};
