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
import { map, uniq } from "lodash";
import { Link } from "expo-router";
import { Horizontal } from "../layout/Stack";
import { List } from "../display/list";

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
  const [value] = useState<number[]>(props.value);
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [addedDocIds, setAddedDocIds] = useState<number[]>([]);

  const { data: relations } = useRelations();
  const { data: permissions } = usePermissions();
  const { data: fields } = useFields(item.collection as keyof CoreSchema);

  const junction = relations?.find(
    (r) =>
      r.related_collection === item.collection &&
      r.meta.one_field === item.field
  );

  const relation = relations?.find(
    (r) => r.field === junction?.meta.junction_field
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

  console.log({ item, relation, junction, value, props });

  return (
    relation &&
    junction && (
      <View style={styles.container}>
        {label && <Text style={formControlStyles.label}>{label}</Text>}
        <List>
          {uniq([...(props.value || []), ...(value || [])]).map((id) => {
            const isDeselected =
              value?.includes(id) && !props.value.includes(id);
            const isNew = !value?.includes(id);
            return (
              <DocListItem
                key={id}
                docId={id}
                junction={junction!}
                relation={relation!}
                template={item.meta.display_options?.template}
                onDelete={(item) => {
                  console.log({ item });
                  setAddedDocIds(
                    addedDocIds.filter(
                      (v) =>
                        v !==
                        (item[relation.field as keyof typeof item] as number)
                    )
                  );
                  props.onChange(props.value.filter((v) => v !== id));
                }}
                isNew={isNew}
                isDeselected={isDeselected}
              />
            );
          })}
        </List>
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

        <Horizontal>
          {allowCreate && (
            <Link href={`/content/${relation.related_collection}/+`} asChild>
              <Button>Add new</Button>
            </Link>
          )}
        </Horizontal>
      </View>
    )
  );
};

const stylesheet = createStyleSheet((theme) => ({
  container: {
    gap: theme.spacing.sm,
  },
  itemList: {
    gap: theme.spacing.sm,
  },
}));
