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
import {
  getAllPathsFromTemplate,
  getFieldPathsFromTemplate,
  getValuesAtPath,
  parseTemplate,
} from "@/helpers/document/template";
import {
  getPrimaryKey,
  getPrimaryKeyFromAllFields,
  getPrimaryKeyValue,
} from "@/hooks/usePrimaryKey";
import { DirectusIcon } from "../display/directus-icon";
import { Text } from "../display/typography";
import { getCollectionTranslation } from "@/helpers/collections/getCollectionTranslation";
import { DirectusErrorResponse } from "@/types/directus";
import { RelatedListItem } from "../display/related-listitem";
import { InterfaceProps } from ".";
import { useModalStore } from "@/state/stores/modalStore";

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
  required,
  ...props
}: M2AInputProps) => {
  if (!item) {
    console.warn(`M2AInput ${label}: item is required`);
    return null;
  }

  const { open: openModal, close: closeModal } = useModalStore()
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
  const junctionItemField = (junction?.meta?.junction_field as string) ?? "item";

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

  const junctionParentIdField = junction?.field;
  const { data: pickedItems, refetch } = useDocuments(
    junction?.collection as keyof CoreSchema,
    {
      fields: ["*"],
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
          (id) =>
            id ===
            `${String(getPrimaryKeyValue(doc, undefined, (doc as any)?.id))}existing`
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

  const NewItem = ({ collection, item: newItem }: { collection: string; item: any }) => {
    const { data } = useCollection(collection as keyof CoreSchema);

    const { data: fields } = useFields(data?.collection as any);
    const effectiveTemplate =
      item?.meta?.options?.template ||
      (data?.meta?.display_template as string | undefined) ||
      "";

    const primaryKey = getPrimaryKey(fields);
    const text = parseTemplate(
      effectiveTemplate,
      newItem as { [key: string]: any },
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
                    newItem?.[primaryKey]
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
    const { data: junctionDocMinimal, error: errorMinimal } = useDocument({
      collection: junction?.collection as keyof CoreSchema,
      id,
      options: { fields: ["*", junctionItemField] },
    });

    const { data: collection } = useCollection(
      junctionDocMinimal?.collection as keyof CoreSchema
    );

    const displayTemplate =
      item?.meta?.options?.template ||
      (collection?.meta?.display_template as string | undefined);
    const templatePaths = getFieldPathsFromTemplate(displayTemplate);
    const relatedCollection = (junctionDocMinimal as Record<string, unknown>)?.["collection"] as string | undefined;
    const rawItem = (junctionDocMinimal as Record<string, unknown>)?.[junctionItemField];
    const itemId = getPrimaryKeyValue(rawItem, undefined, rawItem);

    const { data: fields } = useFields(collection?.collection as any);
    const primaryKey = getPrimaryKey(fields);
    const relatedFields =
      templatePaths.length > 0
        ? [
            primaryKey,
            ...templatePaths
              .map((p) => (p.includes(".$") ? p.split(".$")[0] : p))
              .filter(Boolean),
            // Keep preview labels reliable for nested M2M/M2A display templates (e.g. block_bentogrid.items)
            "*.*.*",
          ]
        : [primaryKey, "*.*.*"];

    const { data: relatedDoc } = useDocument({
      collection: (relatedCollection ?? "") as keyof CoreSchema,
      id: itemId as string | number,
      options: { fields: relatedFields as any },
      query: { enabled: !!relatedCollection && itemId != null && itemId !== "" },
    });

    const junctionDoc = junctionDocMinimal;
    const error = errorMinimal;
    const itemData = (relatedDoc ?? (junctionDoc != null ? (junctionDoc as Record<string, unknown>)?.[junctionItemField] : undefined)) as Record<string, unknown> | undefined;
    let text = parseTemplate(
      displayTemplate,
      itemData as { [key: string]: any },
      fields
    );

    // Template-driven fallback for complex aliases/lists:
    // collect all leaf values referenced by display_template paths.
    const templateLeafValues = (() => {
      if (!displayTemplate || !itemData) return [] as string[];
      const paths = getAllPathsFromTemplate(displayTemplate)
        .map((p) => p.replace(/^item\./, ""))
        .filter(Boolean);
      const values = paths.flatMap((path) => {
        const raw = getValuesAtPath(itemData, path);
        return (Array.isArray(raw) ? raw : [raw]).filter(
          (v) => v != null && typeof v !== "object",
        );
      });
      return uniq(values.map((v) => String(v).trim()).filter(Boolean));
    })();

    if (
      templateLeafValues.length > 0 &&
      (!text ||
        (typeof text === "string" &&
          (!text.trim() ||
            text === String(itemId) ||
            text ===
              String(
                getPrimaryKeyValue(
                  junctionDoc as Record<string, unknown>,
                  undefined,
                  "",
                ) ?? "",
              ))))
    ) {
      text = templateLeafValues.join(", ");
    }
    if (!text || (typeof text === "string" && !text.trim())) {
      text =
        itemId != null
          ? String(itemId)
          : getPrimaryKeyValue(
                junctionDoc as Record<string, unknown>,
                undefined,
                undefined,
              ) != null
            ? String(
                getPrimaryKeyValue(
                  junctionDoc as Record<string, unknown>,
                  undefined,
                  "",
                ),
              )
            : String(id);
    }

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
                  collection: (junctionDoc as Record<string, unknown>)?.collection as string,
                  uuid,
                  item_field: item.field,
                  id: (() => {
                    const raw = (junctionDoc as Record<string, unknown>)?.[junctionItemField];
                    return (
                      getPrimaryKeyValue(raw, fields, raw) ??
                      getPrimaryKeyValue(junctionDoc, undefined, id)
                    ) as string | number;
                  })(),
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
                            (junctionDoc as Record<string, unknown>)?.[junctionItemField] as { [key: string]: any }
                          )?.[sortField as string],
                        }),
                      },
                    ],
                    delete: value.delete.filter((v) => v !== id),
                  });
                } else {
                  props.onChange({
                    ...value,
                    update: value.update.filter(
                      (v) => getPrimaryKeyValue(v, undefined, (v as any)?.id) !== id,
                    ),
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
            router.back()
            onPress({
              pathname: `/modals/m2a/[collection]/${variant}`,
              params: {
                collection: collection,
                junction_collection: junction.collection,
                related_collection: relation.related_collection,
                related_field: relation.field,
                current_value: [
                  ...(pickedItems?.items?.map((i: any) => {
                    const raw = i?.[junction.meta.junction_field as string];
                    if (raw == null) return undefined;
                    return getPrimaryKeyValue(raw, undefined, raw);
                  }) ?? []),
                  ...value.create.map((i: any) => {
                    const v = i?.[junctionItemField];
                    return getPrimaryKeyValue(v, undefined, v);
                  }),
                ]
                  .filter(Boolean)
                  .map(String)
                  .join(","),
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
        {label && (
          <Text style={formControlStyles.label}>
            {label} {required && "*"}
          </Text>
        )}
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
              const relatedDoc =
                typeof junctionDoc === "object" &&
                relation?.field in junctionDoc
                  ? (junctionDoc as any)[relation?.field]
                  : junctionDoc;
              const id: number | string =
                (getPrimaryKeyValue(
                  relatedDoc,
                  undefined,
                  getPrimaryKeyValue(junctionDoc, undefined, ""),
                ) as number | string) ?? "";

              const isDeselected = value.delete?.some((doc) => doc === id);
              const isNew =
                isInitial ? false : !getPrimaryKeyValue(junctionDoc, undefined, undefined);

              if (isNew) {
                return (
                  <Draggable
                    key={JSON.stringify(junctionDoc) + "new"}
                    id={JSON.stringify(junctionDoc) + "new"}
                    disabled={!sortField}
                    activationDelay={300}
                  >
                    <NewItem
                      collection={(junctionDoc as any).collection}
                      item={(junctionDoc as any)[junctionItemField]}
                    />
                  </Draggable>
                );
              }

              return (
                <Draggable
                  key={id + "draggable"}
                  id={id?.toString() + "existing"}
                  disabled={!sortField}
                  activationDelay={300}
                >
                  <Item id={id} isNew={isNew} isDeselected={isDeselected} />
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
                              closeModal();
                            }}
                            collection={collection}
                          />
                        ),
                      )}
                    </Vertical>
                  );
                }, "Create New");

                router.push({ pathname: "/modals/dynamic" });
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
                              closeModal();
                            }}
                            collection={collection}
                          />
                        ),
                      )}
                    </Vertical>
                  );
                }, "Add Existing");
                router.push({ pathname: "/modals/dynamic" });
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
