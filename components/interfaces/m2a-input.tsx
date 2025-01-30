import React, { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import {
  CoreSchema,
  ReadFieldOutput,
  ReadRelationOutput,
  createItem,
  readItems,
} from "@directus/sdk";
import { Modal } from "../display/modal";
import {
  listStyles,
  RelatedDocumentListItem,
} from "./related-document-listitem";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../display/button";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import {
  useCollection,
  useDocument,
  useDocuments,
  useFields,
} from "@/state/queries/directus/collection";
import { usePermissions, useRelations } from "@/state/queries/directus/core";
import { formStyles } from "./style";
import { findIndex, get, map, orderBy, uniq } from "lodash";
import {
  Link,
  RelativePathString,
  router,
  useLocalSearchParams,
} from "expo-router";
import { Horizontal, Vertical } from "../layout/Stack";
import { List, ListItem } from "../display/list";
import { MutateOptions, useQuery } from "@tanstack/react-query";
import { DocumentEditor } from "../content/DocumentEditor";
import EventBus, { MittEvents } from "@/utils/mitt";
import { mutateDocument } from "@/state/actions/updateDocument";
import {
  DndProvider,
  Draggable,
  DraggableStack,
  Droppable,
  UniqueIdentifier,
} from "@mgcrea/react-native-dnd";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { count } from "console";
import { DragIcon, Trash } from "../icons";
import { parseTemplate } from "@/helpers/document/template";
import { getPrimaryKey } from "@/hooks/usePrimaryKey";
import { DirectusIcon } from "../display/directus-icon";
import { Text } from "../display/typography";
import { getCollectionTranslation } from "@/helpers/collections/getCollectionTranslation";
import { DirectusErrorResponse } from "@/types/directus";

type RelatedItem = { id?: number | string; [key: string]: any };
type RelatedItemState = {
  create: RelatedItem[];
  update: RelatedItem[];
  delete: number[];
};

interface M2AInputProps {
  item: ReadFieldOutput<CoreSchema>;
  docId?: number | string;
  value: number[] | RelatedItemState;
  onChange: (value: RelatedItemState) => void;
  label?: string;
  error?: string;
  helper?: string;
  disabled?: boolean;
}

export const M2AInput = ({
  docId,
  item,
  label,
  error,
  helper,
  value: valueProp = [],
  disabled,
  ...props
}: M2AInputProps) => {
  const { styles: formControlStyles } = useStyles(formStyles);
  const { styles } = useStyles(listStyles);
  const { theme } = useStyles();
  const { data: relations } = useRelations();
  const { data: permissions } = usePermissions();
  const { data: fields } = useFields(item.collection as keyof CoreSchema);

  const { t } = useTranslation();

  const junction = relations?.find(
    (r) =>
      r.related_collection === item.collection &&
      r.meta.one_field === item.field
  );

  const sortField = junction?.meta.sort_field;

  const isInitial = Array.isArray(valueProp);
  const value = isInitial
    ? {
        create: [],
        update: [
          ...map(valueProp, (id, index) => ({
            id,
            ...(sortField && { [sortField]: index }),
          })),
        ],
        delete: [],
      }
    : valueProp;

  const relation = relations?.find(
    (r) =>
      r.field === junction?.meta.junction_field &&
      r.collection === junction.meta.many_collection
  );

  const relationPermission =
    permissions?.[relation?.related_collection as keyof typeof permissions];

  const allowCreate =
    relationPermission?.create.access === "full" &&
    get(item, "meta.options.enableCreate") !== false;

  const { mutate: mutateOptions } = mutateDocument(
    junction?.collection as keyof CoreSchema,
    "+"
  );

  const onOrderChange = (newOrder: UniqueIdentifier[]) => {
    const newOrderIds = newOrder.map((id) => parseInt(id as string));
    props.onChange({
      create: value.create.map((doc) => ({
        ...doc,
        [sortField as string]: findIndex(newOrderIds, (id) => id === doc.id),
      })),
      update: value.update.map((doc) => ({
        ...doc,
        [sortField as string]: findIndex(newOrderIds, (id) => id === doc.id),
      })),
      delete: value.delete,
    });
  };

  useEffect(() => {
    const addM2M = (event: MittEvents["m2a:add"]) => {
      if (event.field === item.field) {
        console.log("m2a:add:received", event);

        const data = {
          collection: event.collection,
          [relation?.field as string]: event.data,
          [junction?.field as string]: docId,
          ...(sortField && {
            [sortField as string]:
              [...value.create, ...value.update].length + 1,
          }),
        };
        const newState = {
          create: [...value.create, data],
          update: value.update,
          delete: value.delete,
        };
        props.onChange(newState);
      }
    };
    EventBus.on("m2a:add", addM2M);
    return () => {
      EventBus.off("m2a:add", addM2M);
    };
  }, [valueProp, props.onChange, relation, junction, value]);

  console.log({
    item,
    docId,
    valueProp,
    value,
    junction,
    relation,
  });

  const Item = ({
    id,
    isNew,
    isDeselected,
    isSortable,
  }: {
    id: string | number;
    isNew?: boolean;
    isDeselected?: boolean;
    isSortable?: boolean;
  }) => {
    const { styles, theme } = useStyles(listStyles);
    const [addOpen, setAddOpen] = useState(false);

    const { data: junctionDoc } = useDocument({
      collection: junction?.collection as keyof CoreSchema,
      id,
      options: {
        fields: ["*", "item.*"],
      },
    });

    const { data: collection } = useCollection(
      junctionDoc?.collection as keyof CoreSchema
    );

    const { data: fields } = useFields(collection?.collection as any);

    const primaryKey = getPrimaryKey(fields);
    const text = parseTemplate(
      collection?.meta.display_template as string,
      junctionDoc?.item as { [key: string]: any },
      fields
    );

    if (error) {
      return (
        <View
          style={[
            styles.listItem,
            isDeselected && styles.listItemDeselected,
            isNew && styles.listItemNew,
          ]}
        >
          <Text numberOfLines={1}>{(error as any).errors?.[0].message}</Text>
        </View>
      );
    } /**
    console.log({
      junctionDoc,
      id,
      primaryKey,
      isNew,
      isDeselected,
      collection,
      tmpl: item.meta.display_options?.template.replace(/(?:^|\s):/g, ""),
    }); */

    if (!relation) {
      return null;
    }

    if (isNew) {
      return (
        <Draggable key={id} id={id?.toString()} disabled={!sortField}>
          <View style={[styles.listItem, styles.listItemNew]} key={id}>
            {!!sortField && <DirectusIcon name="drag_handle" />}

            <Horizontal>
              <Text style={{ color: theme.colors.primary, fontWeight: "bold" }}>
                {collection?.collection}:
              </Text>{" "}
              <Text
                numberOfLines={1}
                style={[
                  styles.content,
                  isDeselected && styles.listItemDeselectedText,
                  !!sortField && { marginLeft: 12 },
                  !text && { color: theme.colors.textMuted },
                ]}
              >
                {text || "--"}
              </Text>
            </Horizontal>

            <Button
              variant="ghost"
              rounded
              style={{ marginLeft: "auto" }}
              onPress={() => {
                console.log({
                  field: relation.field,
                  primaryKey,
                  id,
                  create: value.create.filter(
                    (v) => v?.[relation.field]?.[primaryKey] !== id
                  ),
                });
                props.onChange({
                  ...value,
                  create: value.create.filter(
                    (v) => v?.[relation.field]?.[primaryKey] !== id
                  ),
                });
              }}
            >
              <DirectusIcon name="delete" />
            </Button>
          </View>
        </Draggable>
      );
    }

    return junctionDoc ? (
      <View
        style={[
          styles.listItem,
          isDeselected && styles.listItemDeselected,
          isNew && styles.listItemNew,
        ]}
      >
        {isSortable && <DirectusIcon name="drag_handle" />}

        <Horizontal>
          <Text style={{ color: theme.colors.primary, fontWeight: "bold" }}>
            {collection?.collection}:
          </Text>{" "}
          <Text
            numberOfLines={1}
            style={[
              styles.content,
              isDeselected && styles.listItemDeselectedText,
              isSortable && { marginLeft: 12 },
            ]}
          >
            {text}
          </Text>
        </Horizontal>

        <Button
          variant="ghost"
          style={{ marginLeft: "auto" }}
          rounded
          onPress={() => {
            if (isDeselected) {
              props.onChange({
                ...value,
                update: [
                  ...value.update,
                  {
                    id: id as number,
                    ...(sortField && {
                      [sortField]: (
                        junctionDoc?.item as { [key: string]: any }
                      )[sortField as string],
                    }),
                  },
                ],
                delete: value.delete.filter((v) => v !== id),
              });
            } else {
              props.onChange({
                ...value,
                update: value.update.filter((v) => v?.id !== id),
                delete: [...value.delete, id as number],
              });
            }
          }}
        >
          {isDeselected ? (
            <DirectusIcon name="settings_backup_restore" />
          ) : (
            <DirectusIcon name="close" />
          )}
        </Button>
      </View>
    ) : null;
  };

  const CollectionLink = ({
    variant,
    collection,
  }: {
    variant: "add" | "pick";
    collection: string;
  }) => {
    const { data: pickedItems, refetch } = useDocuments(
      collection as keyof CoreSchema,

      {
        fields: [`*`],
      }
    );

    useEffect(() => {
      refetch();
    }, [value.update, value.create, relation, junction, refetch]);

    return (
      !!junction &&
      !!relation && (
        <Link
          href={{
            pathname: `/modals/m2a/[collection]/${variant}`,
            params: {
              collection: collection,
              junction_collection: junction.collection,
              related_collection: relation.related_collection,
              related_field: relation.field,
              current_value: "",
              junction_field: junction.field,
              doc_id: docId,
              item_field: item.field,
            },
          }}
          asChild
        >
          <Button variant="ghost">{collection}</Button>
        </Link>
      )
    );
  };

  return (
    relation &&
    junction && (
      <Vertical spacing="xs">
        {label && <Text style={formControlStyles.label}>{label}</Text>}
        <GestureHandlerRootView>
          <DndProvider>
            <DraggableStack
              key={JSON.stringify(valueProp)}
              direction="column"
              onOrderChange={onOrderChange}
              style={{ gap: 3 }}
            >
              {orderBy(
                [...value.create, ...value.update, ...value.delete],
                sortField || junction?.schema?.foreign_key_column || "id"
              ).map((junctionDoc, index) => {
                if (typeof junctionDoc === "number") {
                  junctionDoc = { id: junctionDoc };
                }
                const primaryKey = "id";

                const relatedDoc =
                  typeof junctionDoc === "object" &&
                  relation?.field in junctionDoc
                    ? (junctionDoc as any)[relation?.field]
                    : junctionDoc;
                const id: number | string =
                  typeof relatedDoc === "number" ||
                  typeof relatedDoc === "string"
                    ? relatedDoc
                    : relatedDoc.id;

                const isDeselected = value.delete?.some((doc) => doc === id);
                const isNew = isInitial ? false : !junctionDoc.id;

                return (
                  <Draggable
                    key={id + "draggable"}
                    id={id?.toString()}
                    disabled={!sortField}
                  >
                    <Item
                      id={id}
                      isNew={isNew}
                      isDeselected={isDeselected}
                      isSortable={!!sortField}
                    />
                  </Draggable>
                );
              })}
            </DraggableStack>
          </DndProvider>
        </GestureHandlerRootView>
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

        {!disabled && (
          <Horizontal spacing="xs">
            {/**allowCreate && (
              <Link
                push
                href={{
                  pathname: `/modals/m2m/[collection]/add`,

                  params: {
                    collection: relation.related_collection,
                    item_field: item.field,
                  },
                }}
                asChild
              >
                <Button>{t("components.shared.createNew")}</Button>
              </Link>
            ) */}

            <Modal>
              <Modal.Trigger>
                <Button>{t("components.shared.createNew")}</Button>
              </Modal.Trigger>
              <Modal.Content>
                {({ close }) => {
                  return (
                    <Vertical>
                      {map(
                        relation?.meta.one_allowed_collections,
                        (collection) => (
                          <CollectionLink
                            variant="add"
                            collection={collection}
                          />
                        )
                      )}
                    </Vertical>
                  );
                }}
              </Modal.Content>
            </Modal>

            <Modal>
              <Modal.Trigger>
                <Button>{t("components.shared.addExisting")}</Button>
              </Modal.Trigger>
              <Modal.Content>
                {({ close }) => {
                  return (
                    <Vertical>
                      {map(
                        relation?.meta.one_allowed_collections,
                        (collection) => (
                          <CollectionLink
                            variant="pick"
                            collection={collection}
                          />
                        )
                      )}
                    </Vertical>
                  );
                }}
              </Modal.Content>
            </Modal>
          </Horizontal>
        )}
      </Vertical>
    )
  );
};
