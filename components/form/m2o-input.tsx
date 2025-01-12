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
import { Modal } from "../display/modal";
import { DocumentEditor } from "../content/DocumentEditor";
import { createStyleSheet } from "react-native-unistyles";

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
}: M2OInputProps) => {
  const { data: options, refetch } = useDocuments(
    item.schema.foreign_key_table as any
  );

  const selectOptions = options?.map((opt: any) => {
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
        options={selectOptions || []}
        value={value}
        onValueChange={onValueChange}
      />

      {item.meta.options?.enableCreate && (
        <Modal>
          <Modal.Trigger>
            <Button>Add new</Button>
          </Modal.Trigger>
          <Modal.Content variant="bottomSheet" title="Add new">
            <DocumentEditor
              collection={item.schema?.foreign_key_table as any}
              id={"+"}
              onSave={() => refetch()}
            />
          </Modal.Content>
        </Modal>
      )}
    </Vertical>
  );
};
