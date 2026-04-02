import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import {
  useCollections,
  usePermissions,
  useRelations,
} from "@/state/queries/directus/core";
import { formStyles } from "./style";
import { findIndex, get, map, merge, orderBy, uniq } from "lodash";
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
import EventBus, {
  MittEvents,
  RelatedItem,
  RelatedItemState,
} from "@/utils/mitt";
import { mutateDocument } from "@/state/actions/updateDocument";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { DragIcon, Trash } from "../icons";
import {
  getAllPathsFromTemplate,
  getFieldPathsFromTemplate,
  getValuesAtPath,
  parseTemplate,
  parseTemplateParts,
} from "@/helpers/document/template";
import { getPrimaryKey } from "@/hooks/usePrimaryKey";
import { DirectusIcon } from "../display/directus-icon";
import { Text } from "../display/typography";
import { getCollectionTranslation } from "@/helpers/collections/getCollectionTranslation";
import { DirectusErrorResponse } from "@/types/directus";
import { RelatedListItem } from "../display/related-listitem";
import { InterfaceProps } from ".";
import { useModalStore } from "@/state/stores/modalStore";
import { generateUUID } from "@/hooks/useUUID";

import { objectToBase64 } from "@/helpers/document/docToBase64";
import { TemplatePartsRenderer } from "../content/TemplatePartsRenderer";
import Sortable from "react-native-sortables";

type M2AInputProps = InterfaceProps<{
  value: number[] | RelatedItem[];
  onChange: (value: RelatedItem[]) => void;
}>;

export const M2AInput = ({
  docId,
  documentSessionId,
  item,
  label,
  error,
  helper,
  value: valueProp = [],
  disabled,
  onChange,
  required,
  ...props
}: M2AInputProps) => {
  if (!item) {
    console.warn(`M2AInput ${label}: item is required`);
    return null;
  }

  const { data: collections } = useCollections();
  const { directus } = useAuth();
  const { open: openModal, close: closeModal } = useModalStore();
  const { styles: formControlStyles } = useStyles(formStyles);
  const { styles, theme } = useStyles();
  const { data: relations } = useRelations();
  const { data: fields } = useFields(item?.collection as keyof CoreSchema);

  const { t } = useTranslation();

  const junction = relations?.find(
    (r) =>
      r.related_collection === item?.collection &&
      r.meta.one_field === item?.field,
  );

  const relation = relations?.find(
    (r) =>
      r.field === junction?.meta.junction_field &&
      r.collection === junction.meta.many_collection,
  );

  /** the id field that connects to the parent document */
  const junctionParentIdField = junction?.field;

  /** the id field that holds the related item */
  const junctionItemField = (junction?.meta?.junction_field as string) ?? "";

  /** the field that holds the related collection */
  const oneCollectionField = relation?.meta.one_collection_field;

  /** the field that holds the sort order */
  const sortField = junction?.meta.sort_field;

  const isInitial = valueProp?.some(
    (v) => typeof v === "number" || typeof v !== "object",
  );

  /**
   * create a junction id for the item, m2a items can have the same id in different collections
   * @param id - the id of the item
   * @param collection - the collection of the item
   * @returns the junction id
   */
  const createJunctionId = (id: number | string, collection: string) => {
    return id.toString().replace(`:${collection}`, "").concat(`:${collection}`);
  };

  /**
   * get the junction id from the item
   * @param v - the item
   * @returns the junction id
   */
  const getJunctionId = (v?: string) => String(v?.split(":")[0]);

  /**
   * create a shallow copy of the value prop to avoid mutating the original value prop
   */
  const shallowValue = useMemo(
    () =>
      isInitial
        ? [
            ...map(valueProp as number[], (id, index) => ({
              id,
              __id: id.toString(),
              __state: RelatedItemState.Default,
              ...(sortField && { [sortField]: index }),
            })),
          ]
        : (valueProp as Record<string, any>[]),
    [valueProp, sortField, isInitial],
  );

  /**
   * fetch the existing items collection, id and itemId from the junction collection
   *
   */
  const { data: existingItems, refetch } = useDocuments(
    junction?.collection as keyof CoreSchema,
    {
      fields: ["id", junctionItemField, oneCollectionField ?? ""],
      filter:
        docId != null && docId !== "+" && junctionParentIdField
          ? { [junctionParentIdField]: { _eq: docId } }
          : undefined,
    },
    {
      enabled:
        !!junction &&
        docId != null &&
        docId !== "+" &&
        !!junctionParentIdField &&
        !!junctionItemField &&
        !!oneCollectionField,
    },
  );

  /**
   * map the shallow value to the existing items
   */
  const value = !!existingItems
    ? shallowValue.map((v) => {
        const existingItem = existingItems?.items?.find(
          (i: any) => String(i.id) === String(getJunctionId(v.__id)),
        );
        const valueItem = valueProp.find(
          (i) => typeof i === "object" && String(i.__id) === String(v.__id),
        ) as RelatedItem;

        const item = !!valueItem ? valueItem : existingItem;

        //console.log({ existingItem, valueItem });
        return {
          ...v,
          __id: createJunctionId(v.__id, item?.[oneCollectionField as string]),
          [junctionItemField as string]: item?.[junctionItemField as string],
          [oneCollectionField as string]: item?.[oneCollectionField as string],
        };
      })
    : shallowValue;

  useEffect(() => {
    const addM2A = (event: MittEvents["m2a:add"]) => {
      if (
        event.field === item.field &&
        event.document_session_id === documentSessionId
      ) {
        console.log("m2a:add:received", event);

        /**
         * __id is set by picking an existing item, and is a valid doc id in the related collection
         * draft_id is set when editing new/existing or picked items (after re-opening) and is always derived from the __id
         * if none are set, generate a new UUID for the new item to allow drafting
         */
        const data: RelatedItem = {
          __id: !!event.__id
            ? createJunctionId(event.__id, event.collection)
            : (event.draft_id ?? generateUUID()),
          __state: event.__id
            ? RelatedItemState.Picked
            : RelatedItemState.Created,
          [oneCollectionField as string]: event.collection,
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
    EventBus.on("m2a:add", addM2A);
    return () => {
      EventBus.off("m2a:add", addM2A);
    };
  }, [
    onChange,
    relation,
    value,
    documentSessionId,
    sortField,
    oneCollectionField,
  ]);

  useEffect(() => {
    const onUpdate = (event: MittEvents["m2a:update"]) => {
      if (
        event.field === item.field &&
        event.document_session_id === documentSessionId
      ) {
        console.log("m2a:update:received", event);

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
    EventBus.on("m2a:update", onUpdate);
    return () => {
      EventBus.off("m2a:update", onUpdate);
    };
  }, [
    onChange,
    relation?.related_collection,
    value,
    documentSessionId,
    item.field,
  ]);

  /**console.log({
    item,
    docId,
    valueProp,
    value,
    junction,
    sortField,
    relation,
    existingItems,
  }); */

  const RenderItem = ({ item: junctionDoc }: RelatedItem) => {
    const { data: collection } = useCollection(
      junctionDoc?.[oneCollectionField as string] as keyof CoreSchema,
    );

    const { data: relatedFields } = useFields(collection?.collection as any);
    const relatedPrimaryKey = getPrimaryKey(relatedFields);

    const relatedCollection = junctionDoc?.[oneCollectionField as string];

    const isDeselected = junctionDoc.__state === RelatedItemState.Deleted;
    const isNew = junctionDoc.__state === RelatedItemState.Created;
    const isUpdated = junctionDoc.__state === RelatedItemState.Updated;
    const isPicked = junctionDoc.__state === RelatedItemState.Picked;

    const relatedItem = junctionDoc?.[junctionItemField as string];
    const relatedItemId =
      typeof relatedItem === "object" && !!relatedPrimaryKey
        ? relatedItem?.[relatedPrimaryKey]
        : relatedItem;

    /**
     * if the item display is related-values, we need to replace the template
     * with the display template for only this collection and remove prepended junction field name
     * example:
     * input template: {{junctionField:collection.field}}
     * output template: {{field}}
     */
    const displayTemplate =
      item?.meta?.display === "related-values"
        ? item?.meta?.display_options?.template?.replace(
            /\{\{\s*([^}]+)\s*\}\}/g,
            (_match: string, rawExpr: string) => {
              const expr = rawExpr.trim();
              const prefix = `${junctionItemField}:`;

              if (!expr.startsWith(prefix)) {
                return `{{${expr}}}`;
              }

              const afterPrefix = expr.slice(prefix.length);
              const dotIndex = afterPrefix.indexOf(".");
              if (dotIndex === -1) return "";

              const collectionName = afterPrefix.slice(0, dotIndex);
              const fieldPath = afterPrefix.slice(dotIndex + 1);

              if (String(collectionName) !== String(relatedCollection)) {
                return "";
              }

              return `{{${fieldPath}}}`;
            },
          )
        : undefined;

    const effectiveTemplate =
      displayTemplate ||
      (collection?.meta?.display_template as string | undefined);

    const templatePaths = getFieldPathsFromTemplate(effectiveTemplate);

    const requestFields =
      templatePaths.length > 0
        ? [
            relatedPrimaryKey,
            ...templatePaths
              .map((p) => (p.includes(".$") ? p.split(".$")[0] : p))
              .filter(Boolean),
          ]
        : [relatedPrimaryKey];

    const { data: relatedDoc } = useDocument({
      collection: (relatedCollection ?? "") as keyof CoreSchema,
      id: relatedItemId as string | number,
      options: { fields: requestFields as any },
      query: {
        enabled:
          !!relatedCollection &&
          relatedItemId != null &&
          relatedItemId !== "" &&
          !!relatedPrimaryKey,
      },
    });

    const draftValue = relatedItem;

    /**
     * check if the draft value has values for non-primary key fields
     */
    const draftValueHasValues =
      typeof relatedItem === "object" &&
      Object.keys(relatedItem || {}).some((key) => {
        const field = relatedFields?.find((f) => f.field === key);
        return !!field && !field?.schema?.is_primary_key;
      });

    const partsFromDoc = parseTemplateParts(
      effectiveTemplate,
      relatedDoc,
      fields,
    );
    const partsFromValue = parseTemplateParts(
      effectiveTemplate,
      draftValue,
      fields,
    );

    const parts =
      !!draftValue && !!draftValueHasValues ? partsFromValue : partsFromDoc;

    /** console.log({
      junctionDoc,
      relatedPrimaryKey,
      displayTemplate,
      requestFields,
      relatedFields,
      relatedItemId,
      relatedDoc,
      partsFromDoc,
      partsFromValue,
      parts,
      isNew,
      isDeselected,
      collection,
      effectiveTemplate,
      draftValue,
      draftValueHasValues,
      item,
    });
 */
    if (!relation) {
      return (
        <RelatedListItem>
          {t("components.shared.error.somethingWentWrong")}
        </RelatedListItem>
      );
    }

    return junctionDoc ? (
      <RelatedListItem
        isDraggable={!!sortField}
        isDeselected={isDeselected}
        isNew={isNew}
        isUpdated={isUpdated}
        isPicked={isPicked}
        prepend={
          <Text style={{ color: theme.colors.primary, fontWeight: "bold" }}>
            {junctionDoc?.[oneCollectionField as string]}:
          </Text>
        }
        append={
          <>
            {!isDeselected && !isPicked && (
              <Link
                href={{
                  pathname: isNew
                    ? `/modals/m2a/[collection]/add`
                    : `/modals/m2a/[collection]/[id]`,
                  params: isNew
                    ? {
                        collection: relatedCollection,
                        document_session_id: documentSessionId,
                        item_field: item.field,
                        id: "add",
                        draft_id: junctionDoc.__id,
                        draft:
                          !!draftValue && typeof draftValue === "object"
                            ? objectToBase64(draftValue)
                            : undefined,
                      }
                    : {
                        collection: relatedCollection,
                        document_session_id: documentSessionId,
                        item_field: item.field,
                        junction_id: (junctionDoc as Record<string, unknown>)
                          ?.id as string | number,
                        id: relatedItemId as string | number,
                        draft_id: junctionDoc.__id,
                        draft:
                          !!draftValue && typeof draftValue === "object"
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
              style={{ marginLeft: "auto" }}
              rounded
              onPress={() => {
                if (isNew || isPicked) {
                  onChange(value.filter((v) => v.__id !== junctionDoc.__id));
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
        <TemplatePartsRenderer parts={parts} />
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
    const { data: relatedFields } = useFields(collection as any);
    const relatedPrimaryKey = getPrimaryKey(relatedFields);
    return (
      !!junction &&
      !!relation && (
        <Button
          variant="ghost"
          onPress={() => {
            closeModal();
            onPress({
              pathname: `/modals/m2a/[collection]/${variant}`,
              params: {
                collection: collection,
                junction_collection: junction.collection,
                related_collection: relation.related_collection,
                related_field: relation.field,
                current_value: [
                  ...value
                    .filter(
                      (v) =>
                        (v.__state === RelatedItemState.Picked ||
                          v.__state === RelatedItemState.Default) &&
                        v?.[oneCollectionField as string] === collection,
                    )
                    .map((i: RelatedItem) => {
                      console.log({ i });
                      const v = i?.[junctionItemField];
                      return typeof v === "object" && !!relatedPrimaryKey
                        ? v?.[relatedPrimaryKey]
                        : v;
                    }),
                ]
                  .filter(Boolean),
                junction_field: junction.field,
                doc_id: docId,
                item_field: item.field,
                document_session_id: documentSessionId,
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
        {label && (
          <Text style={formControlStyles.label}>
            {label} {required && "*"}
          </Text>
        )}

        <Sortable.Grid
          columns={1}
          rowGap={3}
          data={value}
          sortEnabled={!!sortField}
          keyExtractor={(item) => item.__id}
          onDragEnd={(updatedValue) => {
            console.log({ updatedValue });
            onChange(updatedValue.data);
          }}
          renderItem={({ item: junctionDoc }: { item: RelatedItem }) => {
            return (
              <RenderItem
                key={`${junctionDoc.__id}-${documentSessionId}`}
                item={junctionDoc}
              />
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

            <Button
              onPress={() => {
                openModal(() => {
                  console.log("open modal");
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
                            }}
                            collection={collection}
                          />
                        ),
                      )}
                    </Vertical>
                  );
                }, "Create New");
              }}
            >
              {t("components.shared.createNew")}
            </Button>

            <Button
              onPress={() => {
                openModal(() => {
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
                            }}
                            collection={collection}
                          />
                        ),
                      )}
                    </Vertical>
                  );
                }, "Add Existing");
              }}
            >
              {t("components.shared.addExisting")}
            </Button>
          </Horizontal>
        )}
      </Vertical>
    )
  );
};
