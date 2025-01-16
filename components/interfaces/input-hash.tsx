import React, { useState } from "react";
import { TextInput } from "react-native";
import { Input } from "./input";
import { Pressable } from "react-native";
import { Eye } from "../icons";
import { EyeOff } from "../icons";

interface InputHashProps extends React.ComponentProps<typeof Input> {
  // Add any password-specific props here if needed
}

export const InputHash = React.forwardRef<TextInput, InputHashProps>(
  (props, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <Input
        ref={ref}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect={false}
        append={
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={{ padding: 8 }}
          >
            {showPassword ? (
              <EyeOff size={20} color="#A0A0A0" />
            ) : (
              <Eye size={20} color="#A0A0A0" />
            )}
          </Pressable>
        }
        {...props}
      />
    );
  }
);
