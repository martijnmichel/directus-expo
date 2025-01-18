import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { CoreSchema, ReadFieldOutput, readItems } from "@directus/sdk";
import { Select } from "./select";
import { parseTemplate } from "@/helpers/document/template";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../display/button";
import { router } from "expo-router";
import { Horizontal, Vertical } from "../layout/Stack";
import { formStyles } from "./style";
import { useStyles } from "react-native-unistyles";
import { coreCollections } from "@/state/queries/directus/core";
import { useDocuments } from "@/state/queries/directus/collection";
import { createStyleSheet } from "react-native-unistyles";
import { X } from "../icons";

interface Schema {
  [key: string]: any;
}

interface M2OInputProps {
  item: ReadFieldOutput<Schema>;
  value?: string | number;
  onValueChange?: (value: string | number | null) => void;
  label?: string;
  error?: string;
  helper?: string;
  disabled?: boolean;
}

const stylesheet = createStyleSheet((theme) => ({
  text: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textPrimary,
  },
}));

export const M2OInput = ({
  item,
  value,
  onValueChange,
  label,
  error,
  helper,
  disabled,
}: M2OInputProps) => {
  const { data: options, refetch } = useDocuments(
    item.schema.foreign_key_table as any,
    { filter: item.meta.options?.filter }
  );

  const selectOptions = options?.items?.map((opt: any) => {
    return {
      value: opt[item.schema?.foreign_key_column!] || opt.id || "",
      text: parseTemplate(item.meta?.options?.template || "", opt),
    };
  });

  if (!options) return null;

  return (
    <Vertical spacing="xs">
      <Select
        label={label}
        error={error}
        helper={helper}
        disabled={disabled}
        options={selectOptions || []}
        value={value}
        onValueChange={onValueChange}
        append={
          !disabled && (
            <Button
              variant="ghost"
              rounded
              onPress={() => onValueChange?.(null)}
            >
              <X />
            </Button>
          )
        }
      />
    </Vertical>
  );
};
