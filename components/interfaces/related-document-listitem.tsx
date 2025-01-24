import React, { useCallback, useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import { CoreSchema, ReadRelationOutput } from "@directus/sdk";
import { Trash, Edit, Redo, DragIcon } from "../icons";
import { Modal } from "../display/modal";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Text } from "../display/typography";
import { useDocument, useFields } from "@/state/queries/directus/collection";
import { parseTemplate } from "@/helpers/document/template";
import { Link } from "expo-router";
import { Button } from "../display/button";
import { EventBus } from "@/utils/mitt";
import { CoreSchemaDocument } from "@/types/directus";
import { getPrimaryKey, usePrimaryKey } from "@/hooks/usePrimaryKey";

export const RelatedDocumentListItem = <T extends keyof CoreSchema>({
  docId,
  junction,
  relation,
  template,
  onDelete,
  onAdd,
  isNew,
  isDeselected,
  isSortable,
  ...props
}: {
  docId: string | number;
  junction: ReadRelationOutput<CoreSchema>;
  relation: ReadRelationOutput<CoreSchema>;
  template?: string;
  onDelete?: (doc: Record<string, unknown>) => void;
  onAdd?: (doc: Record<string, unknown>) => void;
  isNew?: boolean;
  isDeselected?: boolean;
  isSortable?: boolean;
}) => {
  const { styles } = useStyles(stylesheet);
  const [addOpen, setAddOpen] = useState(false);

  const {
    data: doc,
    isLoading,
    refetch,
    error,
  } = useDocument({
    collection: junction?.meta.many_collection as keyof CoreSchema,
    id: docId,
    options: {
      fields: ["*.*"],
    },
  });

  console.log({ doc });

  const { data: fields } = useFields(relation.related_collection as any);

  useEffect(() => {
    EventBus.on("m2m:update", (event) => {
      if (
        event.collection === relation.related_collection &&
        (
          doc?.[
            junction.meta.junction_field as keyof typeof doc
          ] as CoreSchemaDocument
        )?.[getPrimaryKey(fields) as any] === event.docId
      ) {
        refetch();
      }
    });
    return () => {
      EventBus.off("m2m:update", () => refetch());
    };
  }, [refetch, relation.related_collection, doc]);

  if (error) {
    return (
      <View
        style={[
          styles.listItem,
          isDeselected && styles.listItemDeselected,
          isNew && styles.listItemNew,
        ]}
      >
        <Text>{JSON.stringify(error)}</Text>
      </View>
    );
  }

  return doc ? (
    <View
      style={[
        styles.listItem,
        isDeselected && styles.listItemDeselected,
        isNew && styles.listItemNew,
      ]}
    >
      {isSortable && <DragIcon />}
      <Text
        numberOfLines={1}
        style={[
          styles.content,
          isDeselected && styles.listItemDeselectedText,
          isSortable && { marginLeft: 12 },
        ]}
      >
        {parseTemplate(template, doc, fields)}
      </Text>

      <Link
        href={{
          pathname: `/modals/m2m/[collection]/[id]`,
          params: {
            collection: relation.related_collection,
            id: (
              doc?.[
                junction.meta.junction_field as keyof typeof doc
              ] as CoreSchemaDocument
            )?.[getPrimaryKey(fields) as any],
          },
        }}
        asChild
      >
        <Button variant="ghost" rounded>
          <Edit />
        </Button>
      </Link>

      <Button
        variant="ghost"
        onPress={() =>
          isDeselected
            ? onAdd?.(doc as Record<string, unknown>)
            : onDelete?.(doc as Record<string, unknown>)
        }
        rounded
      >
        {isDeselected ? <Redo /> : <Trash />}
      </Button>
    </View>
  ) : null;
};

const stylesheet = createStyleSheet((theme) => ({
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
    paddingLeft: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.border,
    height: 44,
    maxWidth: 500,
  },
  listItemDeselected: {
    borderColor: theme.colors.error,
  },
  listItemDeselectedText: {
    color: theme.colors.error,
    textDecorationLine: "line-through",
  },
  listItemNew: {
    borderColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,

    fontFamily: theme.typography.body.fontFamily,
  },
  deleteButton: {
    marginLeft: theme.spacing.sm,
  },
}));
