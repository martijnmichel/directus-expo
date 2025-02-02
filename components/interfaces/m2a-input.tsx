import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import {
  CoreSchema,
  ReadFieldOutput,
  ReadRelationOutput,
  createItem,
  readItems,
} from "@directus/sdk";
import { Modal } from "../display/modal";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../display/button";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import {
  useAllFields,
  useCollection,
  useDocument,
  useDocuments,
  useFields,
} from "@/state/queries/directus/collection";
import { usePermissions, useRelations } from "@/state/queries/directus/core";
import { formStyles } from "./style";
import { findIndex, get, map, orderBy, uniq } from "lodash";
import {
  Href,
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
import {
  getPrimaryKey,
  getPrimaryKeyFromAllFields,
} from "@/hooks/usePrimaryKey";
import { DirectusIcon } from "../display/directus-icon";
import { Text } from "../display/typography";
import { getCollectionTranslation } from "@/helpers/collections/getCollectionTranslation";
import { DirectusErrorResponse } from "@/types/directus";
import { RelatedListItem } from "../display/related-listitem";
import { InterfaceProps } from ".";

type RelatedItem = { id?: number | string; [key: string]: any };
type RelatedItemState = {
  create: RelatedItem[];
  update: RelatedItem[];
  delete: number[];
};

type M2AInputProps = InterfaceProps<{
  value: number[] | RelatedItemState;
  onChange: (value: RelatedItemState) => void;
}>;

export const M2AInput = ({
  docId,
  uuid,
  item,
  label,
  error,
  helper,
  value: valueProp = [],
  disabled,
  ...props
}: M2AInputProps) => {
  if (!item) {
    console.warn(`M2AInput ${label}: item is required`);
    return null;
  }

  const { styles: formControlStyles } = useStyles(formStyles);
  const { styles, theme } = useStyles();
  const { data: relations } = useRelations();
  const { data: fields } = useFields(item?.collection as keyof CoreSchema);

  const { t } = useTranslation();

  const junction = relations?.find(
    (r) =>
      r.related_collection === item?.collection &&
      r.meta.one_field === item?.field
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

  const onOrderChange = (newOrder: UniqueIdentifier[]) => {
    const newOrderIds = newOrder;
    props.onChange({
      create: value.create.map((doc) => {
        const pk = getPrimaryKeyFromAllFields(doc.collection as any, fields);
        return {
          ...doc,
          [sortField as string]: findIndex(
            newOrderIds,
            (id) => id === `${JSON.stringify(doc)}new`
          ),
        };
      }),
      update: value.update.map((doc) => ({
        ...doc,
        [sortField as string]: findIndex(
          newOrderIds,
          (id) => id === `${doc.id}existing`
        ),
      })),
      delete: value.delete,
    });
  };

  useEffect(() => {
    const addM2M = (event: MittEvents["m2a:add"]) => {
      if (event.uuid === uuid && event.field === item.field) {
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
  }, [valueProp, props.onChange, relation, junction, value, uuid]);

  /** console.log({
    item,
    docId,
    valueProp,
    value,
    junction,
    sortField,
    relation,
  }); */

  const NewItem = ({ collection, item }: { collection: string; item: any }) => {
    const { data } = useCollection(collection as keyof CoreSchema);

    const { data: fields } = useFields(data?.collection as any);

    const primaryKey = getPrimaryKey(fields);
    const text = parseTemplate(
      data?.meta.display_template as string,
      item as { [key: string]: any },
      fields
    );

    return (
      <RelatedListItem
        isNew
        isDraggable={!!sortField}
        prepend={
          <Text style={{ color: theme.colors.primary, fontWeight: "bold" }}>
            {collection}:
          </Text>
        }
        append={
          <Button
            variant="ghost"
            rounded
            style={{ marginLeft: "auto" }}
            onPress={() => {
              props.onChange({
                ...value,
                create: value.create.filter(
                  (v) =>
                    v?.[relation?.field as any]?.[primaryKey] !==
                    item?.[primaryKey]
                ),
              });
            }}
          >
            <DirectusIcon name="delete" />
          </Button>
        }
      >
        {text || "--"}
      </RelatedListItem>
    );
  };

  const Item = ({
    id,
    isNew,
    isDeselected,
  }: {
    id: string | number;
    isNew?: boolean;
    isDeselected?: boolean;
  }) => {
    const { data: junctionDoc, error } = useDocument({
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
        <RelatedListItem>
          {(error as DirectusErrorResponse).errors?.[0].message}
        </RelatedListItem>
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

    return junctionDoc ? (
      <RelatedListItem
        isDraggable={!!sortField}
        isDeselected={isDeselected}
        prepend={
          <Text style={{ color: theme.colors.primary, fontWeight: "bold" }}>
            {collection?.collection}:
          </Text>
        }
        append={
          <>
            <Link
              href={{
                pathname: `/modals/m2a/[collection]/[id]`,
                params: {
                  collection: junctionDoc?.collection as string,
                  uuid,
                  item_field: item.field,
                  id: (junctionDoc.item as any)?.[primaryKey],
                },
              }}
              asChild
            >
              <Button variant="ghost" rounded>
                <DirectusIcon name="edit_square" />
              </Button>
            </Link>

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
          </>
        }
      >
        {text}
      </RelatedListItem>
    ) : null;
  };

  const CollectionLink = ({
    variant,
    collection,
    onPress,
  }: {
    variant: "add" | "pick";
    collection: string;
    onPress: (href: Href) => void;
  }) => {
    return (
      !!junction &&
      !!relation && (
        <Button
          variant="ghost"
          onPress={() => {
            onPress({
              pathname: `/modals/m2a/[collection]/${variant}`,
              params: {
                collection: collection,
                junction_collection: junction.collection,
                related_collection: relation.related_collection,
                related_field: relation.field,
                current_value: [
                  ...value.create.map((i: any) => i?.item.id),
                ].join(","),
                junction_field: junction.field,
                doc_id: docId,
                item_field: item.field,
                uuid,
              },
            });
          }}
        >
          {collection}
        </Button>
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
                sortField || ""
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

                if (isNew) {
                  return (
                    <Draggable
                      key={JSON.stringify(junctionDoc) + "new"}
                      id={JSON.stringify(junctionDoc) + "new"}
                      disabled={!sortField}
                    >
                      <NewItem
                        collection={(junctionDoc as any).collection}
                        item={(junctionDoc as any).item}
                      />
                    </Draggable>
                  );
                }

                return (
                  <Draggable
                    key={id + "draggable"}
                    id={id?.toString() + "existing"}
                    disabled={!sortField}
                  >
                    <Item id={id} isNew={isNew} isDeselected={isDeselected} />
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
              <Modal.Content variant="quickView">
                {({ close }) => {
                  return (
                    <Vertical>
                      {map(
                        relation?.meta.one_allowed_collections,
                        (collection) => (
                          <CollectionLink
                            key={`${collection}-new`}
                            variant="add"
                            onPress={(href) => {
                              router.push(href);
                              close();
                            }}
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
              <Modal.Content variant="quickView">
                {({ close }) => {
                  return (
                    <Vertical>
                      {map(
                        relation?.meta.one_allowed_collections,
                        (collection) => (
                          <CollectionLink
                            key={`${collection}-pick`}
                            variant="pick"
                            onPress={(href) => {
                              router.push(href);
                              close();
                            }}
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
