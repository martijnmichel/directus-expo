import React from "react";
import { View, Text } from "react-native";
import { FieldErrors } from "react-hook-form";
import { useStyles } from "react-native-unistyles";
import { createStyleSheet } from "react-native-unistyles";
import { map } from "lodash";

interface ErrorListProps {
  errors: FieldErrors<any>;
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.error,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  errorText: {
    ...theme.typography.helper,
    color: theme.colors.white,
  },
}));

export const ErrorList = ({ errors }: ErrorListProps) => {
  const { styles } = useStyles(stylesheet);

  // If no errors, return null
  if (Object.keys(errors).length === 0) return null;

  console.log({ errors });

  return (
    <View style={styles.container}>
      {map(errors, (error, i) => (
        <Text key={"error" + i} style={styles.errorText}>
          {error?.message?.toString()}sdf
        </Text>
      ))}
    </View>
  );
};
