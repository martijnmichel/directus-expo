import React, { useCallback, useEffect, useState } from "react";
import { Pressable, TouchableWithoutFeedback, View } from "react-native";
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
import { getFieldPathsFromTemplate, parseTemplate } from "@/helpers/document/template";
import { getPrimaryKey } from "@/hooks/usePrimaryKey";
import { DirectusIcon } from "../display/directus-icon";
import { Text } from "../display/typography";
import { RelatedListItem } from "../display/related-listitem";
import { DirectusErrorResponse } from "@/types/directus";
import { CoreSchemaDocument } from "@/types/directus";
import { InterfaceProps } from ".";

type RelatedItem = { id?: number | string; [key: string]: any };
type RelatedItemState = {
  create: RelatedItem[];
  update: RelatedItem[];
  delete: number[];
};

type M2MInputProps = InterfaceProps<{
  value: number[] | RelatedItemState;
  onChange: (value: RelatedItemState) => void;
}>;

export const M2MInput = ({
  docId,
  uuid,
  item,
  label,
  error,
  helper,
  value: valueProp = [],
  disabled,
  required,
  ...props
}: M2MInputProps) => {
  if (!item) {
    console.warn(`M2MInput ${label}: item is required`);
    return null;
  }

  const { styles: formControlStyles } = useStyles(formStyles);
  const { data: relations } = useRelations();
  const { data: permissions } = usePermissions();
  const { data: fields } = useFields(item?.collection as keyof CoreSchema);

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
  const { data: relatedCollectionMeta } = useCollection(
    relation?.related_collection as keyof CoreSchema,
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
      if (event.field === item.field && event.uuid === uuid) {
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
  }, [valueProp, props.onChange, relation, junction, value, uuid]);

  const onOrderChange = (newOrder: UniqueIdentifier[]) => {
    const newOrderIds = newOrder;
    console.log({ newOrderIds });
    props.onChange({
      create: value.create.map((doc) => {
        console.log(`${JSON.stringify(doc)}new`);
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

  const junctionParentIdField = junction?.field;
  const { data: pickedItems, refetch } = useDocuments(
    junction?.collection as keyof CoreSchema,
    {
      fields: [`*`],
      filter:
        docId != null &&
        docId !== "+" &&
        junctionParentIdField
          ? { [junctionParentIdField]: { _eq: docId } }
          : undefined,
    },
    {
      enabled:
        !!junction &&
        docId != null &&
        docId !== "+" &&
        !!junctionParentIdField,
    }
  );

  useEffect(() => {
    refetch();
  }, [docId, junction?.collection, refetch]);

 /** console.log({
    item,
    docId,
    valueProp,
    value,
    junction,
    relation,
    pickedItems,
  });  */

  const Item = <T extends keyof CoreSchema>({
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
    const { data: fields } = useFields(relation.related_collection as any);
    const { data: junctionFields } = useFields(
      junction?.meta.many_collection as any,
    );
    const { data: relatedCollection } = useCollection(
      relation.related_collection as keyof CoreSchema,
    );
    const interfaceTemplate = template || "";
    const effectiveTemplate =
      interfaceTemplate ||
      (relatedCollection?.meta?.display_template as string | undefined) ||
      "";
    const pk = getPrimaryKey(fields);
    const junctionField = String(junction.meta.junction_field);
    const templatePaths = getFieldPathsFromTemplate(effectiveTemplate)
      .map((p) => (p.includes(".$") ? p.split(".$")[0] : p))
      .filter(Boolean);
    const prefixedTemplatePaths = templatePaths.map((p) =>
      p.startsWith(`${junctionField}.`) ? p : `${junctionField}.${p}`,
    );
    const requestFields = uniq([
      pk,
      junctionField,
      ...templatePaths,
      ...prefixedTemplatePaths,
      "*.*.*",
    ]).filter(Boolean);

    const {
      data: doc,
      isLoading,
      refetch,
      error,
    } = useDocument({
      collection: junction?.meta.many_collection as keyof CoreSchema,
      id: docId,
      options: {
        fields: requestFields as any,
      },
    });

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
        <RelatedListItem>
          {(error as DirectusErrorResponse).errors?.[0].message}
        </RelatedListItem>
      );
    }

    const parsedFromDoc = parseTemplate(effectiveTemplate, doc, fields);
    const parsedFromRelated = parseTemplate(
      effectiveTemplate,
      ((doc as any)?.[junctionField] ?? doc) as any,
      fields,
    );
    const text =
      interfaceTemplate.length > 0 ? parsedFromDoc : parsedFromRelated || parsedFromDoc;
    const relatedPk = getPrimaryKey(fields) as string;
    const junctionPk = (getPrimaryKey(junctionFields) as string) || "id";
    const rawJunctionValue = (doc as Record<string, unknown>)?.[junctionField];
    const editId =
      rawJunctionValue != null &&
      typeof rawJunctionValue === "object"
        ? ((rawJunctionValue as Record<string, unknown>)?.[relatedPk] ??
          (rawJunctionValue as Record<string, unknown>)?.[junctionPk] ??
          docId)
        : rawJunctionValue ?? docId;

    return doc ? (
      <RelatedListItem
        isDeselected={isDeselected}
        isNew={isNew}
        isDraggable={isSortable}
        append={
          <>
            <Link
              href={{
                pathname: `/modals/m2m/[collection]/[id]`,
                params: {
                  collection: relation.related_collection,
                  uuid,
                  id: editId as string | number,
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
              onPress={() =>
                isDeselected
                  ? onAdd?.(doc as Record<string, unknown>)
                  : onDelete?.(doc as Record<string, unknown>)
              }
              rounded
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

  return (
    relation &&
    junction && (
      <Vertical spacing="xs">
        {label && (
          <Text style={formControlStyles.label}>
            {label} {required && "*"}
          </Text>
        )}

        <DndProvider minDistance={10}>
          <DraggableStack
            key={JSON.stringify(valueProp)}
            direction="column"
            onOrderChange={onOrderChange}
            gap={3}
          >
            {orderBy(
              [...value.create, ...value.update, ...value.delete],
              sortField || ""
            ).map((junctionDoc, index) => {
              if (typeof junctionDoc === "number") {
                junctionDoc = { id: junctionDoc };
              }
              const primaryKey = relation?.schema?.foreign_key_column;

              const relatedDoc =
                relation?.field in junctionDoc
                  ? (junctionDoc as any)[relation?.field]
                  : junctionDoc;
              const rawId: unknown =
                typeof relatedDoc === "number" || typeof relatedDoc === "string"
                  ? relatedDoc
                  : primaryKey in relatedDoc
                  ? relatedDoc[primaryKey]
                  : (relatedDoc as Record<string, unknown>)?.id;
              const id: number | string =
                rawId != null && typeof rawId === "object"
                  ? ((rawId as Record<string, unknown>)[primaryKey] as
                      | number
                      | string) ??
                    ((junctionDoc as Record<string, unknown>).id as
                      | number
                      | string)
                  : (rawId as number | string);

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
                item.meta.options?.template ||
                  (relatedCollectionMeta?.meta?.display_template as
                    | string
                    | undefined),
                item.meta.options?.template
                  ? {
                      ...junctionDoc,
                    }
                  : ((junctionDoc as any)?.[relation?.field as string] ?? {
                      ...junctionDoc,
                    }),
                fields
              );

              if (isNew) {
                return (
                  <Draggable
                    key={JSON.stringify(junctionDoc) + "new"}
                    id={JSON.stringify(junctionDoc) + "new"}
                    disabled={!sortField}
                  >
                    <RelatedListItem
                      isNew
                      isDraggable={!!sortField}
                      append={
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
                      }
                    >
                      {text || "--"}
                    </RelatedListItem>
                  </Draggable>
                );
              }

              return (
                <Draggable
                  key={id + "draggable"}
                  id={id?.toString() + "existing"}
                  disabled={!sortField}
                  activationDelay={200}
                >
                  <Item
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
                </Draggable>
              );
            })}
          </DraggableStack>
        </DndProvider>
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
                push
                href={{
                  pathname: `/modals/m2m/[collection]/add`,

                  params: {
                    collection: relation.related_collection,
                    uuid,
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
                  uuid,
                  current_value: [
                    pickedItems?.items?.map(
                      (i: any) => i?.[junction.meta.junction_field as string]
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
