import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { findIndex, get, map, merge, orderBy, uniq } from "lodash";
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
import {
  getFieldPathsFromTemplate,
  parseTemplate,
} from "@/helpers/document/template";
import { getPrimaryKey, getPrimaryKeyValue } from "@/hooks/usePrimaryKey";
import { DirectusIcon } from "../display/directus-icon";
import { Text } from "../display/typography";
import { RelatedListItem } from "../display/related-listitem";
import { DirectusErrorResponse } from "@/types/directus";
import { CoreSchemaDocument } from "@/types/directus";
import { InterfaceProps } from ".";
import { generateUUID } from "@/hooks/useUUID";
import { objectToBase64 } from "@/helpers/document/docToBase64";

enum RelatedItemState {
  Default = "default",
  Created = "created",
  Updated = "updated",
  Deleted = "deleted",
}
type RelatedItem = {
  id?: number | string; // used for existing items
  [key: string]: any;
  __id?: string; // used for new items
  __state?: RelatedItemState;
};

type M2MInputProps = InterfaceProps<{
  value: number[] | RelatedItem[];
  onChange: (value: RelatedItem[]) => void;
}>;

export const M2MInput = ({
  docId,
  documentSessionId,
  item,
  label,
  error,
  helper,
  value: valueProp = [],
  disabled,
  required,
  onChange,
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
      r.meta.one_field === item.field,
  );

  const sortField = junction?.meta.sort_field;

  const isInitial = valueProp?.some(
    (v) => typeof v === "number" || typeof v !== "object",
  );
  const value = useMemo(
    () =>
      isInitial
        ? [
            ...map(valueProp as number[], (id, index) => ({
              id,
              __id: id?.toString(),
              __state: RelatedItemState.Default,
              ...(sortField && { [sortField]: index }),
            })),
          ]
        : (valueProp as Record<string, any>[]),
    [valueProp, sortField, isInitial],
  );

  console.log({ value, valueProp, isInitial });

  const relation = relations?.find(
    (r) =>
      r.field === junction?.meta.junction_field &&
      r.collection === junction.meta.many_collection,
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
    "+",
  );

  useEffect(() => {
    const addM2M = (event: MittEvents["m2m:add"]) => {
      if (
        event.field === item.field &&
        event.document_session_id === documentSessionId
      ) {
        console.log("m2m:add:received", event);

        const data: RelatedItem = {
          __id: generateUUID(),
          __state: RelatedItemState.Created,
          [relation?.field as string]: event.data,
          [sortField as string]: value.length + 1,
        };
        const newState = [...value, data];
        onChange?.(newState);
      }
    };
    EventBus.on("m2m:add", addM2M);
    return () => {
      EventBus.off("m2m:add", addM2M);
    };
  }, [valueProp, onChange, relation, junction, value, documentSessionId]);

  useEffect(() => {
    const onUpdate = (event: MittEvents["m2m:update"]) => {
      if (
        event.field === item.field &&
        event.document_session_id === documentSessionId
      ) {
        console.log("m2m:update:received", event);
        const data: RelatedItem = {
          __state: RelatedItemState.Updated,
          [relation?.field as string]: { ...event.data },
        };
        const newState = value.map((v) =>
          v.id === Number(event.junction_id) ? merge(v, data) : v,
        );
        console.log({ newState, value, relation });
        onChange?.(newState);
      }
    };
    EventBus.on("m2m:update", onUpdate);
    return () => {
      EventBus.off("m2m:update", onUpdate);
    };
  }, [
    onChange,
    relation?.related_collection,
    value,
    documentSessionId,
    item.field,
  ]);

  const onOrderChange = (newOrder: UniqueIdentifier[]) => {
    const newOrderIds = newOrder;
    console.log({ newOrderIds });
    const sortedValue = value.map((v) => ({
      ...v,
      [sortField as string]: findIndex(newOrderIds, (id) => id === v.__id),
    }));
    onChange?.(sortedValue);
  };

  const junctionParentIdField = junction?.field;
  const { data: pickedItems, refetch } = useDocuments(
    junction?.collection as keyof CoreSchema,
    {
      fields: [`*`],
      filter:
        docId != null && docId !== "+" && junctionParentIdField
          ? { [junctionParentIdField]: { _eq: docId } }
          : undefined,
    },
    {
      enabled:
        !!junction && docId != null && docId !== "+" && !!junctionParentIdField,
    },
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
      ...prefixedTemplatePaths,
      "*.*",
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

    if (error) {
      return (
        <RelatedListItem>
          {(error as DirectusErrorResponse).errors?.[0].message}
        </RelatedListItem>
      );
    }

    const draftJunctionDoc = value.find((v) => v.id === docId);
    const draftValue = draftJunctionDoc
      ? (draftJunctionDoc as any)[relation?.field as string]
      : undefined;

    // note: if the interface template is used, directus returns the template path from the document, otherwise parse it from the junction doc
    const parsedFromDoc = parseTemplate(
      effectiveTemplate,
      interfaceTemplate ? doc : (doc?.[relation?.field as string] ?? doc),
      fields,
    );
    const parsedFromValue = parseTemplate(
      effectiveTemplate,
      interfaceTemplate ? (draftJunctionDoc as any) : (draftValue as any),
      fields,
    );
    const text = draftValue ? parsedFromValue : parsedFromDoc;

    console.log({
      docId,
      doc,
      interfaceTemplate,
      value,
      draftValue,
      parsedFromDoc,
      parsedFromValue,
      effectiveTemplate,
      requestFields,
      junctionField,
      templatePaths,
      prefixedTemplatePaths,
    });
    const rawJunctionValue = (doc as Record<string, unknown>)?.[junctionField];
    const editId =
      getPrimaryKeyValue(rawJunctionValue, fields) ??
      getPrimaryKeyValue(rawJunctionValue, junctionFields, docId) ??
      getPrimaryKeyValue(docId, junctionFields);

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
                  document_session_id: documentSessionId,
                  id: editId as string | number,
                  junction_id: docId as string | number,
                  item_field: item.field,
                  draft: draftValue ? objectToBase64(draftValue) : undefined,
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
            key={documentSessionId}
            direction="column"
            onOrderChange={onOrderChange}
            gap={3}
          >
            {orderBy(value, sortField || "").map((junctionDoc, index) => {
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
                    : getPrimaryKeyValue(relatedDoc, fields, relatedDoc);
              const id: number | string = (getPrimaryKeyValue(rawId, fields) ??
                getPrimaryKeyValue(
                  junctionDoc,
                  undefined,
                  getPrimaryKeyValue(rawId, undefined, ""),
                ) ??
                "") as number | string;

              const isDeselected = junctionDoc.__state === RelatedItemState.Deleted;
              const isNew = junctionDoc.__state === RelatedItemState.Created;

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
                fields,
              );

              if (isNew) {
                return (
                  <Draggable
                    id={junctionDoc.__id}
                    disabled={!sortField || !junctionDoc.__id}
                    activationDelay={200}
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
                            });
                            const newState = value.filter((v) => v.id !== id);
                            onChange?.(newState);
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
                  id={junctionDoc.__id}
                  disabled={!sortField || !junctionDoc.__id}
                  activationDelay={200}
                >
                  <Item
                    key={`${id}-${junctionDoc.__id}-${documentSessionId}`}
                    docId={id}
                    junction={junction!}
                    relation={relation!}
                    template={item.meta.options?.template}
                    isSortable={!!sortField}
                    onAdd={(item) => {
                      const newState = value.map((v) =>
                        v.id === item.id ? { ...v, __state: "default" } : v,
                      );
                      onChange?.(newState);
                    }}
                    onDelete={(item) => {
                      const newState = value.map((v) =>
                        v.id === item.id ? { ...v, __state: "deleted" } : v,
                      );
                      onChange?.(newState);
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
                    document_session_id: documentSessionId,
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
                  document_session_id: documentSessionId,
                  current_value: [
                    pickedItems?.items?.map(
                      (i: any) => i?.[junction.meta.junction_field as string],
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
