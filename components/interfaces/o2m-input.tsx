import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Sortable, SortableItem } from "react-native-reanimated-dnd";
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
import {
  EventBus,
  MittEvents,
  RelatedItem,
  RelatedItemState,
} from "@/utils/mitt";
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
import { DragIcon, Trash } from "../icons";
import {
  getFieldPathsFromTemplate,
  parseTemplateParts,
  parseTemplate,
} from "@/helpers/document/template";
import { getPrimaryKey, usePrimaryKey } from "@/hooks/usePrimaryKey";
import { DirectusIcon } from "../display/directus-icon";
import { Text } from "../display/typography";
import { CoreSchemaDocument, DirectusErrorResponse } from "@/types/directus";
import React from "react";
import { RelatedListItem } from "../display/related-listitem";
import { InterfaceProps } from ".";
import { generateUUID } from "@/hooks/useUUID";
import { objectToBase64 } from "@/helpers/document/docToBase64";
import { TemplatePartsRenderer } from "../content/TemplatePartsRenderer";

type O2MInputProps = InterfaceProps<{
  value: number[] | RelatedItem[];
  onChange: (value: RelatedItem[]) => void;
}>;

export const O2MInput = ({
  docId,
  item,
  uuid: documentSessionId,
  label,
  error,
  helper,
  value: valueProp = [],
  disabled,
  required,
  ...props
}: O2MInputProps) => {
  if (!item) {
    console.warn(`O2MInput ${label}: item is required`);
    return null;
  }

  const { styles: formControlStyles } = useStyles(formStyles);
  const [initialValue] = useState(valueProp);
  const { data: relations } = useRelations();
  const { data: permissions } = usePermissions();
  const { data: fields } = useFields(item.collection as keyof CoreSchema);

  const { t } = useTranslation();

  const primaryKey = usePrimaryKey(item.collection as any);

  const relation = relations?.find(
    (r) =>
      r.related_collection === item.collection &&
      r.meta.one_field === item.field,
  );

  const { data: relatedCollectionMeta } = useCollection(
    relation?.collection as keyof CoreSchema,
  );
  const { data: relatedFields } = useFields(relation?.collection as any);

  const relatedPk = relatedFields ? getPrimaryKey(relatedFields) : undefined;

  const sortField = relation?.meta.sort_field;

  const isInitial = valueProp?.some(
    (v) => typeof v === "number" || typeof v !== "object",
  );
  const value = useMemo(
    () =>
      isInitial
        ? [
            ...map(valueProp as number[], (id, index) => ({
              ...(relatedPk ? { [relatedPk]: id } : {}),
              __id: id?.toString(),
              __state: RelatedItemState.Default,
              ...(sortField && { [sortField]: index }),
            })),
          ]
        : (valueProp as Record<string, any>[]),
    [valueProp, sortField, isInitial, relatedPk],
  );

  const interfaceTemplate = item.meta.options?.template || "";

  const effectiveTemplate =
    interfaceTemplate ||
    (relatedCollectionMeta?.meta?.display_template as string | undefined) ||
    "";

  const templatePaths = getFieldPathsFromTemplate(effectiveTemplate)
    .map((p) => (p.includes(".$") ? p.split(".$")[0] : p))
    .filter(Boolean);

  const requestFields = relation
    ? uniq([relatedPk, ...templatePaths]).filter(Boolean)
    : [];

  const getRelatedPkValue = (v: RelatedItem) => {
    return v[relatedPk as string];
  };

  const { data: docs, error: docsError } = useDocuments(
    relation?.collection as keyof CoreSchema,
    {
      fields: requestFields as any,
      filter: relatedPk
        ? {
            [relatedPk]: {
              _in: value.map(getRelatedPkValue).filter((x) => !!x),
            },
          }
        : undefined,
    },
    {
      enabled:
        !!value?.length &&
        !!relation?.collection &&
        !!relatedCollectionMeta?.collection &&
        !!relatedPk,
    },
  );

  /**console.log({
    docs,
    value,
    primaryKey,
    relatedPk,
    requestFields,
    relation,
    relatedCollectionMeta,
    sortField,
  }); */

  const relationPermission =
    permissions?.[relation?.related_collection as keyof typeof permissions];

  const allowCreate =
    relationPermission?.create.access === "full" &&
    get(item, "meta.options.enableCreate") !== false;

  useEffect(() => {
    const addO2M = (event: MittEvents["o2m:add"]) => {
      if (
        event.field === item.field &&
        event.document_session_id === documentSessionId
      ) {
        console.log("o2m:add:received", event);

        /**
         * __id is set by picking an existing item, and is a valid doc id in the related collection
         * draft_id is set when editing new/existing or picked items (after re-opening) and is always derived from the __id
         * if none are set, generate a new UUID for the new item to allow drafting
         */
        const data: RelatedItem = {
          __id: event.__id ?? event.draft_id ?? generateUUID(),
          __state: event.__id
            ? RelatedItemState.Picked
            : RelatedItemState.Created,
          ...event.data,
          ...(sortField && { [sortField as string]: value.length + 1 }),
        };

        /**
         * if draft_id is set and __id is not, update the existing item by merging the data with the existing item
         * otherwise add the new item to the state
         */
        const newState =
          !!event.draft_id && !event.__id
            ? value.map((v) => (v.__id === event.draft_id ? merge(v, data) : v))
            : [...value, data];

        /**
         * update the state with the new item
         */
        props.onChange(newState);
      }
    };
    EventBus.on("o2m:add", addO2M);
    return () => {
      EventBus.off("o2m:add", addO2M);
    };
  }, [props.onChange, value, documentSessionId, sortField]);

  useEffect(() => {
    const updateO2M = (event: MittEvents["o2m:update"]) => {
      if (
        event.field === item.field &&
        event.document_session_id === documentSessionId
      ) {
        console.log("o2m:update:received", event);

        const currentItem = value.find((v) => v.__id === event.draft_id);
        console.log({ currentItem });

        /**
         * update the item in the state
         */
        const data: RelatedItem = {
          __state: RelatedItemState.Updated,
          ...event.data,
        };

        /**
         * update the state with the new item
         */
        const newState = value.map((v) =>
          v.__id === event.draft_id ? merge(v, data) : v,
        );

        console.log({ newState, value, relation });
        props.onChange(newState);
      }
    };
    EventBus.on("o2m:update", updateO2M);
    return () => {
      EventBus.off("o2m:update", updateO2M);
    };
  }, [
    valueProp,
    props.onChange,
    relation,
    value,
    documentSessionId,
    sortField,
  ]);

  const onOrderChange = (newOrder: UniqueIdentifier[]) => {
    const newOrderIds = newOrder;
    console.log({ newOrderIds });
  };

  return (
    relation &&
    !value.some((v) => typeof v === "number") && (
      <Vertical spacing="xs">
        {label && (
          <Text style={formControlStyles.label}>
            {label} {required && "*"}
          </Text>
        )}
        <DndProvider>
          <DraggableStack
            direction="column"
            style={{ gap: 3 }}
            onOrderChange={(newOrderIds: UniqueIdentifier[]) => {
              const newValue = newOrderIds.map(
                (id) => value.find((v) => v.__id === id) as RelatedItem,
              );
              console.log({ newValue, newOrderIds });
              props.onChange(newValue);
            }}
          >
            {value.map((relationDoc: RelatedItem) => {
              const isDefault =
                relationDoc.__state === RelatedItemState.Default;
              const isDeselected =
                relationDoc.__state === RelatedItemState.Deleted;
              const isNew = relationDoc.__state === RelatedItemState.Created;
              const isSortable = !!sortField;
              const isPicked = relationDoc.__state === RelatedItemState.Picked;
              const isUpdated =
                relationDoc.__state === RelatedItemState.Updated;

              const doc = docs?.items?.find(
                (v) =>
                  String(getRelatedPkValue(v)) === String(relationDoc.__id),
              );

              const draftValue = relationDoc ? (relationDoc as any) : undefined;

              const parsedFromDoc = parseTemplate(
                effectiveTemplate,
                doc,
                fields,
              );
              const parsedFromValue = parseTemplate(
                effectiveTemplate,
                draftValue,
                fields,
              );
              const partsFromDoc = parseTemplateParts(
                effectiveTemplate,
                doc,
                fields,
              );
              const partsFromValue = parseTemplateParts(
                effectiveTemplate,
                draftValue,
                fields,
              );

              /**
               * check if the draft value has values for non-primary key fields
               */
              const draftValueHasValues = Object.keys(draftValue || {}).some(
                (key) => {
                  const field = relatedFields?.find((f) => f.field === key);
                  return (
                    !!field &&
                    !field?.schema?.is_primary_key &&
                    field.field !== sortField
                  );
                },
              );

              const text =
                draftValue && draftValueHasValues
                  ? parsedFromValue
                  : parsedFromDoc;

              /**console.log({
  text,
  parsedFromDoc,
  parsedFromValue,
  draftValue,
  draftValueHasValues,
  doc,
  relationDoc,
}); */

              return (
                <Draggable
                  key={relationDoc.__id?.toString() ?? "" + documentSessionId}
                  id={relationDoc.__id?.toString() ?? ""}
                  disabled={!sortField}
                  activationDelay={200}
                >
                  <RelatedListItem
                    isDraggable={isSortable}
                    isDeselected={isDeselected}
                    isUpdated={isUpdated}
                    isNew={isNew}
                    isPicked={isPicked}
                    append={
                      <>
                        {!isDeselected && !isPicked && (
                          <Link
                            href={{
                              pathname: isNew
                                ? `/modals/o2m/[collection]/add`
                                : `/modals/o2m/[collection]/[id]`,
                              params: isNew
                                ? {
                                    collection: relation.collection,
                                    document_session_id: documentSessionId,
                                    id: "",
                                    item_field: item.field,
                                    draft_id: relationDoc?.__id,
                                    draft: draftValue
                                      ? objectToBase64(draftValue)
                                      : undefined,
                                  }
                                : {
                                    collection: relation.collection,
                                    document_session_id: documentSessionId,
                                    id: relationDoc.__id as string | number,
                                    draft_id: relationDoc?.__id,
                                    item_field: item.field,
                                    draft:
                                      !isDefault && draftValue
                                        ? objectToBase64(draftValue)
                                        : undefined,
                                  },
                            }}
                            asChild
                          >
                            <Button variant="ghost" rounded>
                              <DirectusIcon name="edit_square" />
                            </Button>
                          </Link>
                        )}

                        <Button
                          variant="ghost"
                          onPress={() => {
                            if (isNew || isPicked) {
                              props.onChange(
                                value.filter(
                                  (v) => v.__id !== relationDoc.__id,
                                ),
                              );
                            } else {
                              if (isDeselected) {
                                props.onChange(
                                  value.map((v) =>
                                    v.__id === relationDoc.__id
                                      ? {
                                          ...v,
                                          __state: RelatedItemState.Default,
                                        }
                                      : v,
                                  ),
                                );
                              } else {
                                props.onChange(
                                  value.map((v) =>
                                    v.__id === relationDoc.__id
                                      ? {
                                          ...v,
                                          __state: RelatedItemState.Deleted,
                                        }
                                      : v,
                                  ),
                                );
                              }
                            }
                          }}
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
                    <TemplatePartsRenderer
                      parts={
                        draftValue && draftValueHasValues
                          ? partsFromValue
                          : partsFromDoc
                      }
                    />
                  </RelatedListItem>
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
                href={{
                  pathname: `/modals/o2m/[collection]/add`,
                  params: {
                    collection: relation.collection,
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
                pathname: `/modals/o2m/[collection]/pick`,
                params: {
                  collection: relation.collection,
                  related_field: relation.field,
                  document_session_id: documentSessionId,
                  current_value: [
                    ...map(value, (v) => (v as any)?.[relatedPk as string]),
                  ].join(","),
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
