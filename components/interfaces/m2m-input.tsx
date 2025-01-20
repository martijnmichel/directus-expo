import React, { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  CoreSchema,
  ReadFieldOutput,
  ReadRelationOutput,
  createItem,
  readItems,
} from "@directus/sdk";
import { Modal } from "../display/modal";
import { RelatedDocumentListItem } from "./related-document-listitem";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../display/button";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { useDocument, useFields } from "@/state/queries/directus/collection";
import { usePermissions, useRelations } from "@/state/queries/directus/core";
import { formStyles } from "./style";
import { get, map, uniq } from "lodash";
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

interface M2MInputProps {
  item: ReadFieldOutput<CoreSchema>;
  docId?: number | string;
  value: number[];
  onChange: (value: number[]) => void;
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
  const { directus } = useAuth();
  const [value] = useState<number[]>(valueProp);
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [addedDocIds, setAddedDocIds] = useState<number[]>([]);

  const { data: relations } = useRelations();
  const { data: permissions } = usePermissions();
  const { data: fields } = useFields(item.collection as keyof CoreSchema);

  const junction = relations?.find(
    (r) =>
      r.related_collection === item.collection &&
      r.meta.one_field === item.field
  );

  const sortField = junction?.meta.sort_field;
  console.log({ sortField });

  const relation = relations?.find(
    (r) => r.field === junction?.meta.junction_field
  );

  const junctionPermissions =
    permissions?.[junction?.meta.many_collection as keyof typeof permissions];
  const relationPermission =
    permissions?.[relation?.related_collection as keyof typeof permissions];

  const allowJunctionCreate =
    junctionPermissions?.create.access === "full" ||
    (junction?.meta.one_field &&
      junctionPermissions?.create.fields?.includes(junction?.meta.one_field));

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
          [relation?.field as string]: event.data.id,
        };
        console.log("m2m:add:sending", data);
        mutateOptions(
          data,
          // @ts-ignore
          {
            onSuccess: (newData: any) => {
              console.log("m2m:add:success", newData);
              setAddedDocIds([...addedDocIds, newData.id]);
              props.onChange([...valueProp, newData.id]);
            },
          }
        );
      }
    };
    EventBus.on("m2m:add", addM2M);
    return () => {
      EventBus.off("m2m:add", addM2M);
    };
  }, [addedDocIds, valueProp, props.onChange, relation, junction]);

  const onOrderChange = (newOrder: UniqueIdentifier[]) => {
    const newOrderIds = newOrder.map((id) => parseInt(id as string));
    props.onChange?.(newOrderIds);
  };

  console.log({ valueProp, relation, junction, item });

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
              {uniq([...(valueProp || []), ...(value || [])]).map((id) => {
                const isDeselected =
                  value?.includes(id) && !valueProp.includes(id);
                const isNew = !value?.includes(id);

                const Item = (
                  <RelatedDocumentListItem
                    key={id}
                    docId={id}
                    junction={junction!}
                    relation={relation!}
                    template={item.meta.options?.template}
                    isSortable={!!sortField}
                    onAdd={(item: Record<string, unknown>) => {
                      setAddedDocIds([...addedDocIds, item.id as number]);
                      props.onChange([...valueProp, item.id as number]);
                    }}
                    onDelete={(item) => {
                      console.log({ item });
                      setAddedDocIds(
                        addedDocIds.filter(
                          (v) =>
                            v !==
                            (item[relation.field as keyof typeof item] as any)
                        )
                      );
                      props.onChange(valueProp.filter((v) => v !== id));
                    }}
                    isNew={isNew}
                    isDeselected={isDeselected}
                  />
                );
                return (
                  <Draggable
                    key={id + "draggable"}
                    id={id.toString()}
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
                <Button>Add new</Button>
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
                  current_value: valueProp.join(","),
                  junction_field: junction.field,
                  doc_id: docId,
                  item_field: item.field,
                },
              }}
              asChild
            >
              <Button>Add existing</Button>
            </Link>
          </Horizontal>
        )}
      </Vertical>
    )
  );
};
