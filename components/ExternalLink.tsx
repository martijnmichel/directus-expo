import { Link } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
  Button,
  ButtonProps,
  Platform,
  Pressable,
  PressableProps,
} from "react-native";
import { Horizontal } from "./layout/Stack";
import { DirectusIcon } from "./display/directus-icon";
import * as Linking from "expo-linking";
import { Text } from "./display/typography";
export function ExternalLink({
  children,
  ...props
}: PressableProps & { href: string }) {
  return (
    <Pressable
      {...props}
      onPress={(e) => {
        if (Platform.OS !== "web") {
          // Prevent the default behavior of linking to the default browser on native.
          e.preventDefault();
          // Open the link in an in-app browser.
          Linking.openURL(props.href as string);
        }
      }}
    >
      <Horizontal>
        {typeof children === "object" ? (
          children
        ) : (
          <Text style={{ textDecorationLine: "underline" }}>
            {children as string}
          </Text>
        )}
        <DirectusIcon size={16} name="open_in_new" />
      </Horizontal>
    </Pressable>
  );
}
