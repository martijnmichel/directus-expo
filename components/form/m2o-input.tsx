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

interface Schema {
  [key: string]: any;
}

interface M2OInputProps {
  item: ReadFieldOutput<Schema>;
  value?: string | number;
  onValueChange?: (value: string | number) => void;
  label?: string;
  error?: string;
  helper?: string;
}

export const M2OInput = ({
  item,
  value,
  onValueChange,
  label,
  error,
  helper,
}: M2OInputProps) => {
  const { data: options } = useDocuments(item.schema.foreign_key_table as any);

  const selectOptions = options?.map((opt) => {
    return {
      value: opt[item.schema.foreign_key_column!] || opt.id || "",
      text: parseTemplate(item.meta.options?.template || "", opt),
    };
  });

  if (!options) return null;

  return (
    <Vertical spacing="xs">
      <Select
        label={label}
        error={error}
        helper={helper}
        options={selectOptions || []}
        value={value}
        onValueChange={onValueChange}
      />

      {item.meta.options?.enableCreate && (
        <Horizontal>
          <Button
            onPress={() => {
              router.push(`/content/${item.schema.foreign_key_table}/+`);
            }}
          >
            Add
          </Button>
        </Horizontal>
      )}
    </Vertical>
  );
};
