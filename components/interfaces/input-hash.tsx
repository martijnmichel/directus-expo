import React, { useState } from "react";
import { TextInput, TextInputProps } from "react-native";
import { Input } from "./input";
import { Pressable } from "react-native";
import { Eye } from "../icons";
import { EyeOff } from "../icons";
import { InterfaceProps } from "./index";

type InputHashProps = InterfaceProps<TextInputProps>;

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
