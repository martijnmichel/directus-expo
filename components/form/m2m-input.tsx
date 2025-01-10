import React, { useState } from "react";
import { Text, View } from "react-native";
import {
  CoreSchema,
  ReadFieldOutput,
  ReadRelationOutput,
  createItem,
} from "@directus/sdk";
import { Modal } from "../display/modal";
import { DocListItem } from "./doc-listitem";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../display/button";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { useDocument, useFields } from "@/state/queries/directus/collection";
import { usePermissions, useRelations } from "@/state/queries/directus/core";
import { formStyles } from "./style";
import { map } from "lodash";
import { Link } from "expo-router";

interface M2MInputProps {
  item: ReadFieldOutput<CoreSchema>;
  docId?: number | string;
  value: number[];
  onChange: (value: number[]) => void;
  label?: string;
  error?: string;
  helper?: string;
}

export const M2MInput = ({
  docId,
  item,
  label,
  error,
  helper,
  ...props
}: M2MInputProps) => {
  const { styles } = useStyles(stylesheet);
  const { styles: formControlStyles } = useStyles(formStyles);
  const { directus } = useAuth();
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [addedDocIds, setAddedDocIds] = useState<number[]>([]);

  const { data: relations } = useRelations();
  const { data: permissions } = usePermissions();
  const { data: fields } = useFields(item.collection as keyof CoreSchema);

  const relation = relations?.find(
    (r) => r.collection === item.collection && r.field === item.field
  );

  const junction = relations?.find(
    (r) =>
      r.collection === relation?.junction_collection &&
      r.field === relation?.junction_field
  );

  const junctionPermissions =
    permissions?.[junction?.meta.many_collection as keyof typeof permissions];
  const relationPermission =
    permissions?.[relation?.related_collection as keyof typeof permissions];

  const allowJunctionCreate =
    junctionPermissions?.create.access === "full" ||
    (junction?.meta.one_field &&
      junctionPermissions?.create.fields?.includes(junction?.meta.one_field));

  const allowCreate = relationPermission?.create.access === "full";

  const handleDelete = async (doc: CoreSchema[keyof CoreSchema]) => {
    const newValue = props.value.filter((v) => v !== doc.id);
    props.onChange(newValue);
  };

  return (
    relation &&
    junction && (
      <View style={styles.container}>
        {label && <Text style={formControlStyles.label}>{label}</Text>}
        <View style={styles.itemList}>
          {map(props.value || [], (id) => {
            const isNew = addedDocIds.includes(id);
            const isDeselected = !props.value.includes(id);

            return (
              <DocListItem
                key={id}
                docId={id}
                junction={junction!}
                relation={relation!}
                template={item.meta.display_options?.template}
                onDelete={handleDelete}
                isNew={isNew}
                isDeselected={isDeselected}
              />
            );
          })}
        </View>
        {(error || helper) && (
          <Text
            style={[
              formControlStyles.helperText,
              error && formControlStyles.errorText,
            ]}
          >
            {error || helper}
          </Text>
        )}

        {allowCreate && (
          <Link href={`/content/${relation.related_collection}/+`} asChild>
            <Button variant="soft">Add new</Button>
          </Link>
        )}
      </View>
    )
  );
};

const stylesheet = createStyleSheet((theme) => ({
  container: {
    gap: theme.spacing.md,
  },
  itemList: {
    gap: theme.spacing.sm,
  },
}));
