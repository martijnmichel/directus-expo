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
import { findIndex, get, isNaN, map, merge, orderBy, uniq } from "lodash";
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
import EventBus, {
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
import { count } from "console";
import { DragIcon, Trash } from "../icons";
import {
  getFieldPathsFromTemplate,
  parseTemplateParts,
} from "@/helpers/document/template";
import { getPrimaryKey } from "@/hooks/usePrimaryKey";
import { DirectusIcon } from "../display/directus-icon";
import { Text } from "../display/typography";
import { RelatedListItem } from "../display/related-listitem";
import { DirectusErrorResponse } from "@/types/directus";
import { CoreSchemaDocument } from "@/types/directus";
import { InterfaceProps } from ".";
import { generateUUID } from "@/hooks/useUUID";
import { objectToBase64 } from "@/helpers/document/docToBase64";
import { Sortable, SortableItem } from "react-native-reanimated-dnd";
import { TemplatePartsRenderer } from "../content/TemplatePartsRenderer";

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

  /**
   * find the junction relation
   */
  const junction = relations?.find(
    (r) =>
      r.related_collection === item.collection &&
      r.meta.one_field === item.field,
  );

  /**
   * find the relation that connects the junction to the related collection
   */
  const relation = relations?.find(
    (r) =>
      r.field === junction?.meta.junction_field &&
      r.collection === junction.meta.many_collection,
  );

  /**
   * get the related collection
   */
  const { data: relatedCollection } = useCollection(
    relation?.related_collection as keyof CoreSchema,
  );

  const { data: relatedFields } = useFields(
    relatedCollection?.collection as any,
  );

  const sortField = junction?.meta.sort_field;

  const junctionParentIdField = junction?.field;
  const junctionField = String(junction?.meta.junction_field);

  const pk = getPrimaryKey(fields);

  const relatedPrimaryKey = relatedFields
    ? getPrimaryKey(relatedFields)
    : undefined;

  /**
   * check if the value is an array of ids
   */
  const isInitial = valueProp?.some(
    (v) => typeof v === "number" || typeof v !== "object",
  );

  /**
   * create a shallow copy of the value prop to avoid mutating the original value prop
   */
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

  /**
   * check if the user has permission to create items in the related collection
   */
  const relationPermission =
    permissions?.[relation?.related_collection as keyof typeof permissions];

  /**
   * check if the user has permission to create items in the related collection
   */
  const allowCreate =
    relationPermission?.create.access === "full" &&
    get(item, "meta.options.enableCreate") !== false;

  useEffect(() => {
    const addM2M = (event: MittEvents["m2m:add"]) => {
      if (
        event.field === item.field &&
        event.document_session_id === documentSessionId
      ) {
        console.log("m2m:add:received", event);

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
          [relation?.field as string]: event.data,
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
        onChange?.(newState);
      }
    };
    EventBus.on("m2m:add", addM2M);
    return () => {
      EventBus.off("m2m:add", addM2M);
    };
  }, [onChange, relation, value, documentSessionId, sortField]);

  /**
   * handle the update event
   */
  useEffect(() => {
    const onUpdate = (event: MittEvents["m2m:update"]) => {
      if (
        event.field === item.field &&
        event.document_session_id === documentSessionId
      ) {
        console.log("m2m:update:received", event);

        const currentItem = value.find((v) => v.__id === event.draft_id);
        console.log({ currentItem });

        /**
         * update the item in the state
         */
        const data: RelatedItem = {
          __state: RelatedItemState.Updated,
          [relation?.field as string]: { ...event.data },
        };

        /**
         * update the state with the new item
         */
        const newState = value.map((v) =>
          v.__id === event.draft_id ? merge(v, data) : v,
        );

        //console.log({ newState, value, relation });
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

  const interfaceTemplate = item.meta.options?.template || "";

  const effectiveTemplate =
    interfaceTemplate ||
    (relatedCollection?.meta?.display_template as string | undefined) ||
    "";

  const templatePaths = getFieldPathsFromTemplate(effectiveTemplate)
    .map((p) => (p.includes(".$") ? p.split(".$")[0] : p))
    .filter(Boolean);

  const prefixedTemplatePaths = templatePaths.map((p) =>
    p.startsWith(`${junctionField}.`) ? p : `${junctionField}.${p}`,
  );

  const requestFields = uniq([
    pk,
    junctionField,
    `${junctionField}.${relatedPrimaryKey}`,
    ...prefixedTemplatePaths,
  ]).filter(Boolean);

  /**
   * filter the junction ids, newly created items will have an uuid as __id
   */
  const filteredJunctionIds = value
    .map((v) => v.__id)
    .filter((v) => !isNaN(Number(v)));

  /**
   * get the related documents
   */
  const { data: relatedDocs } = useDocuments(
    junction?.meta.many_collection as keyof CoreSchema,
    {
      fields: requestFields as any,
      filter: {
        id: { _in: filteredJunctionIds },
      },
    },
    {
      enabled:
        !!junction &&
        !!junction?.meta.many_collection &&
        filteredJunctionIds.length > 0,
    },
  );

  // console.log({ relatedDocs, requestFields });

  /**  useEffect(() => {
    refetch();
  }, [docId, junction?.collection, refetch]); */

  console.log({
    item,
    docId,
    valueProp,
    value,
    junction,
    relation,
    pickedItems,
    relatedDocs,
  });

  return (
    relation &&
    junction && (
      <Vertical spacing="xs">
        {label && (
          <Text style={formControlStyles.label}>
            {label} {required && "*"}
          </Text>
        )}

        <Sortable
          data={value}
          itemKeyExtractor={(item) => item.__id.toString()}
          itemHeight={50}
          renderItem={({ item: junctionDoc, id: __sortId, ...rest }) => {
            if (typeof junctionDoc === "number") {
              junctionDoc = { id: junctionDoc };
            }

            const isDeselected =
              junctionDoc.__state === RelatedItemState.Deleted;
            const isNew = junctionDoc.__state === RelatedItemState.Created;
            const isUpdated = junctionDoc.__state === RelatedItemState.Updated;
            const isPicked = junctionDoc.__state === RelatedItemState.Picked;
            /** console.log({
                  junctionDoc,
                  relatedDoc,
                  id,
                  primaryKey,
                  fk: relation?.schema.foreign_key_column,
                  isNew,
                  isDeselected,
                }); */

            /** database document */
            const doc = relatedDocs?.items?.find(
              (v) => String(v.id) === String(junctionDoc.__id),
            );

            /** draft junction document */
            const draftJunctionDoc = value.find(
              (v) =>
                String(v.id) === String(junctionDoc.__id) ||
                String(v.__id) === String(junctionDoc.__id),
            );

            /** draft related collection document */
            const draftValue = draftJunctionDoc
              ? (draftJunctionDoc as any)[relation?.field as string]
              : undefined;

            /**
             * note: if the interface template is used, directus returns the template path from the document
             * otherwise parse it from the junction doc
             */
            const partsFromDoc = parseTemplateParts(
              effectiveTemplate,
              interfaceTemplate
                ? doc
                : (doc?.[relation?.field as string] ?? doc),
              fields,
            );
            const partsFromValue = parseTemplateParts(
              effectiveTemplate,
              interfaceTemplate
                ? (draftJunctionDoc as any)
                : (draftValue as any),
              fields,
            );

            /** related collection document id */
            const relatedDocId = (doc ?? draftJunctionDoc)?.[
              relation?.field as string
            ]?.[relatedPrimaryKey as string];

            return (
              <SortableItem
                key={`${junctionDoc.__id}-${documentSessionId}`}
                id={junctionDoc.__id}
                data={junctionDoc}
                onDrop={(id, position, allPositions) => {
                  onChange(
                    value.map((v) => ({
                      ...v,
                      [sortField as string]: allPositions?.[v.__id],
                    })),
                  );
                }}
                {...rest}
              >
                <RelatedListItem
                  isDeselected={isDeselected}
                  isNew={isNew}
                  isDraggable={!!sortField}
                  isUpdated={isUpdated}
                  isPicked={isPicked}
                  append={
                    <>
                      {!isDeselected && !isPicked && (
                        <Link
                          href={{
                            pathname: isNew
                              ? `/modals/m2m/[collection]/add`
                              : `/modals/m2m/[collection]/[id]`,
                            params: isNew
                              ? {
                                  collection: relation.related_collection,
                                  document_session_id: documentSessionId,
                                  item_field: item.field,
                                  id: relatedDocId as string | number,
                                  draft_id: draftJunctionDoc?.__id,
                                  draft: draftValue
                                    ? objectToBase64(draftValue)
                                    : undefined,
                                }
                              : {
                                  collection: relation.related_collection,
                                  document_session_id: documentSessionId,
                                  id: relatedDocId as string | number,
                                  junction_id: docId as string | number,
                                  draft_id: draftJunctionDoc?.__id,
                                  item_field: item.field,
                                  draft: draftValue
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
                            onChange(
                              value.filter((v) => v.__id !== junctionDoc.__id),
                            );
                          } else {
                            if (isDeselected) {
                              onChange(
                                value.map((v) =>
                                  v.__id === junctionDoc.__id
                                    ? {
                                        ...v,
                                        __state: RelatedItemState.Default,
                                      }
                                    : v,
                                ),
                              );
                            } else {
                              onChange(
                                value.map((v) =>
                                  v.__id === junctionDoc.__id
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
                    parts={draftValue ? partsFromValue : partsFromDoc}
                  />
                </RelatedListItem>
              </SortableItem>
            );
          }}
        />

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
