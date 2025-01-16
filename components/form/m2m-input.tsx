import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  CoreSchema,
  ReadFieldOutput,
  ReadRelationOutput,
  createItem,
  readItems,
} from "@directus/sdk";
import { Modal } from "../display/modal";
import { DocListItem } from "./doc-listitem";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../display/button";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { useDocument, useFields } from "@/state/queries/directus/collection";
import { usePermissions, useRelations } from "@/state/queries/directus/core";
import { formStyles } from "./style";
import { map, uniq } from "lodash";
import {
  Link,
  RelativePathString,
  router,
  useLocalSearchParams,
} from "expo-router";
import { Horizontal, Vertical } from "../layout/Stack";
import { List, ListItem } from "../display/list";
import { useQuery } from "@tanstack/react-query";
import { DocumentEditor } from "../content/DocumentEditor";
import EventBus, { MittEvents } from "@/utils/mitt";
import { mutateDocument } from "@/state/actions/mutateItem";

interface M2MInputProps {
  item: ReadFieldOutput<CoreSchema>;
  docId?: number | string;
  value: number[];
  onChange: (value: number[]) => void;
  label?: string;
  error?: string;
  helper?: string;
}

export const M2MInput = ({
  docId,
  item,
  label,
  error,
  helper,
  value: valueProp = [],
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

  const allowCreate = relationPermission?.create.access === "full";

  const { mutate: mutateOptions } = mutateDocument(
    junction?.collection as keyof CoreSchema,
    "+"
  );

  useEffect(() => {
    const updateM2M = (event: any) => {
      console.log("m2m:update", event);
    };
    EventBus.on("m2m:update", updateM2M);

    const addM2M = (event: MittEvents["m2m:add"]) => {
      if (event.field === item.field) {
        console.log("m2m:add", event);

        const data = {
          [relation?.field as string]: event.data.id as number,
        };
        mutateOptions(data, {
          onSuccess: (newData) => {
            console.log({ newData });
            setAddedDocIds([...addedDocIds, newData.id]);
            props.onChange([...valueProp, newData.id]);
          },
        });
      }
    };
    EventBus.on("m2m:add", addM2M);
    return () => {
      EventBus.off("m2m:update", updateM2M);
      EventBus.off("m2m:add", addM2M);
    };
  }, []);

  return (
    relation &&
    junction && (
      <Vertical spacing="xs">
        {label && <Text style={formControlStyles.label}>{label}</Text>}
        <List>
          {uniq([...(valueProp || []), ...(value || [])]).map((id) => {
            const isDeselected = value?.includes(id) && !valueProp.includes(id);
            const isNew = !value?.includes(id);
            return (
              <DocListItem
                key={id}
                docId={id}
                junction={junction!}
                relation={relation!}
                template={item.meta.options?.template}
                onAdd={(item: Record<string, unknown>) => {
                  setAddedDocIds([...addedDocIds, item.id as number]);
                  props.onChange([...valueProp, item.id as number]);
                }}
                onDelete={(item) => {
                  console.log({ item });
                  setAddedDocIds(
                    addedDocIds.filter(
                      (v) =>
                        v !== (item[relation.field as keyof typeof item] as any)
                    )
                  );
                  props.onChange(valueProp.filter((v) => v !== id));
                }}
                isNew={isNew}
                isDeselected={isDeselected}
              />
            );
          })}
        </List>
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

          {/** <Modal>
            <Modal.Trigger>
              <Button>Add existing</Button>
            </Modal.Trigger>
            <Modal.Content variant="bottomSheet" title="Import from URL">
              {({ close }) => (
                <List>
                  {options?.map((opt) => (
                    <Pressable
                      key={opt.id}
                      onPress={async () => {
                        close();
                        console.log(opt);

                        console.log(
                          opt[
                            relation?.schema
                              .foreign_key_column as keyof typeof opt
                          ]
                        );

                        try {
                          const doc = (await directus!.request(
                            createItem(
                              junction?.collection as keyof CoreSchema,
                              {
                                [relation.field]:
                                  opt[
                                    relation?.schema
                                      .foreign_key_column as keyof typeof opt
                                  ],
                              }
                            )
                          )) as { id: number } & Record<string, unknown>;
                          console.log({ doc, docDoc: doc[relation.field] });
                          setAddedDocIds([
                            ...addedDocIds,
                            doc[relation.field] as number,
                          ]);
                          props.onChange([...valueProp, doc.id]);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                    >
                      <ListItem>{JSON.stringify(opt)}</ListItem>
                    </Pressable>
                  ))}
                </List>
              )}
            </Modal.Content>
          </Modal> */}
        </Horizontal>
      </Vertical>
    )
  );
};
