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
import { EventBus, MittEvents } from "@/utils/mitt";
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
import { parseTemplate } from "@/helpers/document/template";
import { getPrimaryKey, usePrimaryKey } from "@/hooks/usePrimaryKey";
import { DirectusIcon } from "../display/directus-icon";
import { Text } from "../display/typography";
import { CoreSchemaDocument, DirectusErrorResponse } from "@/types/directus";
import React from "react";
import { RelatedListItem } from "../display/related-listitem";
import { InterfaceProps } from ".";

type RelatedItem = { id?: number | string; [key: string]: any };
type RelatedItemState = {
  create: RelatedItem[];
  update: RelatedItem[];
  delete: number[];
};

type O2MInputProps = InterfaceProps<{
  value: number[] | RelatedItemState;
  onChange: (value: RelatedItemState) => void;
}>;

type O2MItemRowProps = {
  collection: string;
  relatedCollection: string;
  uuid: string;
  docId: string | number;
  isDeselected?: boolean;
  isSortable?: boolean;
  value: RelatedItemState;
  onChange: (value: RelatedItemState) => void;
  relatedPk: string;
  sortField?: string;
  template?: string;
};

function O2MItemRow({
  collection,
  relatedCollection,
  uuid,
  docId,
  isDeselected,
  isSortable,
  value,
  onChange,
  relatedPk,
  sortField,
  template,
}: O2MItemRowProps) {
  const {
    data: doc,
    error,
  } = useDocument({
    collection: collection as keyof CoreSchema,
    id: docId,
    options: { fields: ["*.*"] },
  });
  const { data: fields } = useFields(relatedCollection as keyof CoreSchema);

  if (error) {
    return (
      <RelatedListItem>
        {(error as DirectusErrorResponse).errors?.[0].message}
      </RelatedListItem>
    );
  }
  if (!doc) return null;

  return (
    <RelatedListItem
      isDraggable={isSortable}
      isDeselected={isDeselected}
      append={
        <>
          <Link
            href={{
              pathname: `/modals/m2m/[collection]/[id]`,
              params: {
                collection: collection ?? "",
                uuid,
                id: String(docId),
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
            rounded
            onPress={() => {
              if (isDeselected) {
                onChange({
                  ...value,
                  update: [
                    ...value.update,
                    {
                      [relatedPk]: docId as number,
                      ...(sortField && { [sortField]: doc[sortField as string] }),
                    },
                  ],
                  delete: value.delete.filter((v) => v !== docId),
                });
              } else {
                onChange({
                  ...value,
                  update: value.update.filter((v) => v?.[relatedPk] !== docId),
                  delete: [...value.delete, docId as number],
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
      {parseTemplate(template, doc, fields)}
    </RelatedListItem>
  );
}

export const O2MInput = ({
  docId,
  item,
  uuid,
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

  const relation = relations?.find(
    (r) =>
      r.related_collection === item.collection &&
      r.meta.one_field === item.field
  );

  const relatedPk = usePrimaryKey(relation?.collection as any);

  const sortField = relation?.meta.sort_field;

  const isInitial = Array.isArray(valueProp);
  const value = isInitial
    ? {
        create: [],
        update: [
          ...map(valueProp, (id, index) => ({
            [relatedPk || ""]: id,
            ...(sortField && { [sortField]: index }),
          })),
        ],
        delete: [],
      }
    : valueProp;

  const relationPermission =
    permissions?.[relation?.related_collection as keyof typeof permissions];

  const allowCreate =
    relationPermission?.create.access === "full" &&
    get(item, "meta.options.enableCreate") !== false;

  useEffect(() => {
    const addO2M = (event: MittEvents["o2m:pick"]) => {
      if (event.field === item.field && event.uuid === uuid) {
        console.log("o2m:pick:received", event);

        const data = {
          [relation?.field as string]: event.data,
          [sortField as string]: [...value.create, ...value.update].length + 1,
        };
        const newState = {
          create: value.create,
          update: [...value.update, event.data],
          delete: value.delete,
        };
        props.onChange(newState);
      }
    };
    EventBus.on("o2m:pick", addO2M);
    return () => {
      EventBus.off("o2m:pick", addO2M);
    };
  }, [valueProp, props.onChange, relation, value, uuid]);

  useEffect(() => {
    const addO2M = (event: MittEvents["o2m:add"]) => {
      if (event.field === item.field && event.uuid === uuid) {
        console.log("o2m:add:received", event);

        const newState = {
          create: [...value.create, event.data],
          update: value.update,
          delete: value.delete,
        };
        props.onChange(newState);
      }
    };
    EventBus.on("o2m:add", addO2M);
    return () => {
      EventBus.off("o2m:add", addO2M);
    };
  }, [valueProp, props.onChange, relation, value, uuid]);

  const onOrderChange = (newOrder: UniqueIdentifier[]) => {
    const newOrderIds = newOrder;
    console.log({ newOrderIds });
    props.onChange({
      create: value.create.map((doc, index) => {
        return {
          ...doc,
          [sortField as string]: findIndex(
            newOrderIds,
            (id) => id === `${JSON.stringify(doc)}`
          ),
        };
      }),
      update: value.update.map((doc, index) => ({
        ...doc,
        [sortField as string]: findIndex(
          newOrderIds,
          (id) => id === `${JSON.stringify(doc)}`
        ),
      })),
      delete: value.delete,
    });
  };

  const filterIdsKey = useMemo(
    () =>
      JSON.stringify({
        update: value.update
          .map((v) => (v as any)?.[relatedPk] ?? (v as any)?.id)
          .filter(Boolean)
          .sort(),
        create: value.create
          .map(
            (v) =>
              (v as any)?.[relation?.field as string]?.[
                relation?.schema?.foreign_key_column as string
              ]
          )
          .filter(Boolean)
          .sort(),
      }),
    [value.update, value.create, relatedPk, relation?.field, relation?.schema]
  );

  const documentsFilter = useMemo(() => {
    if (!relation?.schema) return undefined;
    try {
      const { update, create } = JSON.parse(filterIdsKey) as {
        update: (string | number)[];
        create: (string | number)[];
      };
      const ids = [...new Set([...update, ...create])];
      if (!ids.length) return undefined;
      return {
        [relation.schema.column as string]: { _in: ids },
      };
    } catch {
      return undefined;
    }
  }, [filterIdsKey, relation?.schema]);

  const documentsQuery = useMemo(
    () => ({
      fields: [`*`],
      ...(documentsFilter && { filter: documentsFilter }),
    }),
    [documentsFilter]
  );

  useDocuments(relation?.collection as keyof CoreSchema, documentsQuery);

  return (
    relation && (
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
              sortField || relation?.schema?.foreign_key_column || "id"
            ).map((relatedDoc, index) => {
              const primaryKey = relation?.schema?.foreign_key_column;

              const id: number | string =
                typeof relatedDoc === "number" || typeof relatedDoc === "string"
                  ? relatedDoc
                  : (relatedDoc as any)?.[relatedPk || ""];

              const isDeselected = value.delete?.some((doc) => doc === id);
              const isNew = isInitial
                ? false
                : !((initialValue as number[]) || []).includes(id as number);

              const text = parseTemplate<any>(
                item.meta.options?.template,
                relatedDoc,
                fields
              );

              if (isNew) {
                return (
                  <Draggable
                    key={JSON.stringify(relatedDoc)}
                    id={JSON.stringify(relatedDoc)}
                    disabled={!sortField}
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
                            props.onChange({
                              ...value,
                              create: value.create.filter(
                                (v) => v?.[relatedPk] !== id
                              ),
                              update: value.update.filter(
                                (v) => v?.[relatedPk] !== id
                              ),
                            });
                          }}
                        >
                          <DirectusIcon name="delete" />
                        </Button>
                      }
                    >
                      {text}
                    </RelatedListItem>
                  </Draggable>
                );
              }

              return (
                <Draggable
                  key={JSON.stringify(relatedDoc)}
                  id={JSON.stringify(relatedDoc)}
                  disabled={!sortField}
                  activationDelay={200}
                >
                  <O2MItemRow
                    collection={relation.collection ?? ""}
                    relatedCollection={relation.related_collection ?? ""}
                    uuid={uuid ?? ""}
                    docId={id}
                    isDeselected={isDeselected}
                    isSortable={!!sortField}
                    value={value}
                    onChange={props.onChange}
                    relatedPk={relatedPk || ""}
                    sortField={sortField ?? undefined}
                    template={item.meta.options?.template ?? undefined}
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
                href={{
                  pathname: `/modals/o2m/[collection]/add`,
                  params: {
                    collection: relation.collection,
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
                pathname: `/modals/o2m/[collection]/pick`,
                params: {
                  collection: relation.collection,
                  related_field: relation.field,
                  uuid,
                  current_value: [
                    ...map(value.update, (v) => (v as any)?.[relatedPk]),
                    ...map(value.create, (v) => (v as any)?.[relatedPk]),
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
