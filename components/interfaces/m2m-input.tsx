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

type RelatedItem = { id?: number | string; [key: string]: any };
type RelatedItemState = {
  create: RelatedItem[];
  update: RelatedItem[];
  delete: number[];
};

interface M2MInputProps {
  item: ReadFieldOutput<CoreSchema>;
  docId?: number | string;
  value: number[] | RelatedItemState;
  onChange: (value: RelatedItemState) => void;
  label?: string;
  error?: string;
  helper?: string;
  disabled?: boolean;
}

export const M2MInput = ({
  docId,
  item,
  label,
  error,
  helper,
  value: valueProp = [],
  disabled,
  ...props
}: M2MInputProps) => {
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

  useEffect(() => {
    const addM2M = (event: MittEvents["m2m:add"]) => {
      if (event.field === item.field) {
        console.log("m2m:add:received", event);

        const data = {
          [relation?.field as string]: event.data,
          [sortField as string]: [...value.create, ...value.update].length + 1,
        };
        const newState = {
          create: [...value.create, data],
          update: value.update,
          delete: value.delete,
        };
        props.onChange(newState);
      }
    };
    EventBus.on("m2m:add", addM2M);
    return () => {
      EventBus.off("m2m:add", addM2M);
    };
  }, [valueProp, props.onChange, relation, junction, value]);

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

  const { data: pickedItems, refetch } = useDocuments(
    junction?.collection as keyof CoreSchema,

    {
      fields: [`*`],
      filter: {
        [relation?.schema.column as any]: {
          _in: [
            ...value.update.map((v) => v.id),
            ...value.create.map(
              (v) =>
                v[relation?.field as any]?.[
                  relation?.schema.foreign_key_column as any
                ]
            ),
          ],
        },
      },
    },
    { enabled: !!junction?.collection && !!relation?.schema && !!value }
  );

  useEffect(() => {
    if (value) refetch();
  }, [...value.create, ...value.update, ...value.delete]);

  /**console.log({
    item,
    docId,
    valueProp,
    value,
    junction,
    relation,
    pickedItems,
  }); */

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
                sortField || relation?.schema.foreign_key_column || "id"
              ).map((junctionDoc, index) => {
                if (typeof junctionDoc === "number") {
                  junctionDoc = { id: junctionDoc };
                }
                const primaryKey = relation?.schema.foreign_key_column;

                const relatedDoc =
                  relation?.field in junctionDoc
                    ? (junctionDoc as any)[relation?.field]
                    : junctionDoc;
                const id: number | string =
                  typeof relatedDoc === "number" ||
                  typeof relatedDoc === "string"
                    ? relatedDoc
                    : primaryKey in relatedDoc
                    ? relatedDoc[primaryKey]
                    : relatedDoc.id;

                const isDeselected = value.delete?.some((doc) => doc === id);
                const isNew = isInitial ? false : !junctionDoc.id;

                /** console.log({
                  junctionDoc,
                  relatedDoc,
                  id,
                  primaryKey,
                  fk: relation?.schema.foreign_key_column,
                  isNew,
                  isDeselected,
                }); */

                const text = parseTemplate(
                  item.meta.options?.template,
                  {
                    ...junctionDoc,
                  },
                  fields
                );

                if (isNew) {
                  return (
                    <Draggable
                      key={id}
                      id={id?.toString() || index.toString()}
                      disabled={!sortField}
                    >
                      <View
                        style={[styles.listItem, styles.listItemNew]}
                        key={id}
                      >
                        {!!sortField && <DirectusIcon name="drag_handle" />}

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

                        <Button
                          variant="ghost"
                          rounded
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

                const Item = (
                  <RelatedDocumentListItem
                    key={id}
                    docId={id}
                    junction={junction!}
                    relation={relation!}
                    template={item.meta.options?.template}
                    isSortable={!!sortField}
                    onAdd={(item) => {
                      console.log({ item });
                      props.onChange({
                        ...value,
                        update: [
                          ...value.update,
                          {
                            id: item.id as number,
                            ...(sortField && {
                              [sortField]: item[sortField as string],
                            }),
                          },
                        ],
                        delete: value.delete.filter((v) => v !== id),
                      });
                    }}
                    onDelete={(item) => {
                      console.log({ item });

                      props.onChange({
                        ...value,
                        update: value.update.filter((v) => v?.id !== id),
                        delete: [...value.delete, id as number],
                      });
                    }}
                    isNew={isNew}
                    isDeselected={isDeselected}
                  />
                );
                return (
                  <Draggable
                    key={id + "draggable"}
                    id={id?.toString()}
                    disabled={!sortField}
                  >
                    {Item}
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
            {allowCreate && (
              <Link
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
            )}

            <Link
              href={{
                pathname: `/modals/m2m/[collection]/pick`,
                params: {
                  collection: relation.related_collection,
                  junction_collection: junction.collection,
                  related_collection: relation.related_collection,
                  related_field: relation.field,
                  current_value: [
                    pickedItems?.items?.map(
                      (i: any) => i?.[relation.schema.column as any]
                    ),
                  ].join(","),
                  junction_field: junction.field,
                  doc_id: docId,
                  item_field: item.field,
                },
              }}
              asChild
            >
              <Button>{t("components.shared.addExisting")}</Button>
            </Link>
          </Horizontal>
        )}
      </Vertical>
    )
  );
};
