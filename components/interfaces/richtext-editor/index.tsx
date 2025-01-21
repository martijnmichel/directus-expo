import React, { useEffect, useState } from "react";
import { View, Text, Platform } from "react-native";
import { useInitialTheme, useStyles } from "react-native-unistyles";
import { formStyles } from "../style";
import {
  EditorBridge,
  RichText as BaseRichText,
  useEditorBridge,
  Toolbar,
  CoreBridge,
  TenTapStartKit,
  CodeBridge,
  ImageEditorActionType,
  ToolbarItems,
  DEFAULT_TOOLBAR_ITEMS,
  Images,
  BridgeExtension,
} from "@10play/tentap-editor";
import { font } from "./font";
import { uploadFiles } from "@directus/sdk";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/display/button";
import { Modal } from "@/components/display/modal";
import { FileBrowser } from "../file-select";
import { ImageInput } from "../image-input";
import ImageExtension from "@tiptap/extension-image";

const ImageBridge = new BridgeExtension<any, any, any>({
  tiptapExtension: ImageExtension.configure({
    allowBase64: true,
    inline: true,
    HTMLAttributes: {
      class: "editor-image",
    },
  }),
  onBridgeMessage: (editor, message) => {
    console.log("message", message);
    if (message.type === ImageEditorActionType.SetImage) {
      editor
        .chain()
        .focus()
        .setImage({ src: message.payload })
        .setTextSelection(editor.state.selection.to + 1)
        .run();
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      setImage: (src: string) =>
        sendBridgeMessage({
          type: ImageEditorActionType.SetImage,
          payload: src,
        }),
    };
  },
  extendEditorState: (editor) => {
    console.log("editor", editor);
    return {};
  },
  extendCSS: `
  img {
    height: auto;
    max-width: 100%;
  }

  img &.ProseMirror-selectednode {
    outline: 3px solid #68cef8;
  }
  `,
});

interface RichTextProps {
  label?: string;
  error?: string;
  helper?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export const RichText: React.FC<RichTextProps> = ({
  label,
  error,
  helper,
  value,
  onChange,
  disabled,
}) => {
  const { styles } = useStyles(formStyles);
  const { directus } = useAuth();
  const [imagePickOpen, setImagePickOpen] = useState(false);
  const editor = useEditorBridge({
    initialContent: value,
    avoidIosKeyboard: Platform.OS === "ios",

    bridgeExtensions: [CoreBridge.configureCSS(font), ImageBridge],
    dynamicHeight: false,
    theme: {
      toolbar: {
        toolbarBody: {
          backgroundColor: "#eee",
        },
      },
      webview: {
        height: 500,
      },
      webviewContainer: {
        height: 500,
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
      <View style={[styles.richTextContainer, error && styles.inputError]}>
        <Toolbar
          editor={editor}
          hidden={false}
          items={[
            {
              onPress: () => () => {
                setImagePickOpen(true);
              },
              active: () => !disabled,
              disabled: () => !!disabled,
              image: () => Images.Aa,
            },
            ...DEFAULT_TOOLBAR_ITEMS,
          ]}
        />
        <BaseRichText style={styles.richTextEditor} editor={editor} />
      </View>
      {(error || helper) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helper}
        </Text>
      )}

      <Modal open={imagePickOpen} onClose={() => setImagePickOpen(false)}>
        <Modal.Content title="Add image">
          <ImageInput
            onChange={(e) => {
              console.log(e);
            }}
          />
        </Modal.Content>
      </Modal>
    </View>
  );
};
