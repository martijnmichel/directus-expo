import React, { useCallback, useState } from "react";
import { View, Pressable } from "react-native";
import { CoreSchema, ReadRelationOutput } from "@directus/sdk";
import { Trash, Edit } from "../icons";
import { Modal } from "../display/modal";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Text } from "../display/typography";
import { useDocument } from "@/state/queries/directus/collection";
import { parseTemplate } from "@/helpers/document/template";
import { Link } from "expo-router";
import { Button } from "../display/button";

export const DocListItem = <T extends keyof CoreSchema>({
  docId,
  junction,
  relation,
  template,
  onDelete,
  isNew,
  isDeselected,
  ...props
}: {
  docId: string | number;
  junction: ReadRelationOutput<CoreSchema>;
  relation: ReadRelationOutput<CoreSchema>;
  template?: string;
  onDelete?: (doc: CoreSchema<keyof CoreSchema>) => void;
  isNew?: boolean;
  isDeselected?: boolean;
}) => {
  const { styles } = useStyles(stylesheet);
  const [addOpen, setAddOpen] = useState(false);

  const {
    data: doc,
    isLoading,
    error,
  } = useDocument(junction?.meta.many_collection as keyof CoreSchema, docId, {
    fields: ["*.*"],
  });

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
      <Pressable onPress={() => setAddOpen(true)} style={styles.content}>
        <Text>{template ? parseTemplate(template, doc) : doc.id}</Text>
      </Pressable>

      <Link href={`/content/${relation.related_collection}/${docId}`} asChild>
        <Button variant="ghost" rounded>
          <Edit />
        </Button>
      </Link>

      <Button variant="ghost" onPress={() => onDelete?.(doc)} rounded>
        <Trash />
      </Button>
    </View>
  ) : null;
};

const stylesheet = createStyleSheet((theme) => ({
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 48,
  },
  listItemDeselected: {
    opacity: 0.5,
  },
  listItemNew: {
    borderColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  deleteButton: {
    marginLeft: theme.spacing.sm,
  },
}));
