import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  CoreSchema,
  DirectusFile,
  ReadFieldOutput,
  ReadRelationOutput,
  createItem,
  readItems,
} from "@directus/sdk";
import { Modal } from "../display/modal";
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
import EventBus, { MittEvents } from "@/utils/mitt";
import { mutateDocument } from "@/state/actions/updateDocument";
import Sortable from "react-native-sortables";
import { ImageInput } from "./image-input";
import { FileSelect } from "./file-select";
import { mutateDocuments } from "@/state/actions/updateDocuments";
import { useTranslation } from "react-i18next";
import { FloatingToolbarHost } from "../display/floating-toolbar";
import { RelatedListItem } from "../display/related-listitem";
import { DirectusIcon } from "../display/directus-icon";
import { CoreSchemaDocument, DirectusErrorResponse } from "@/types/directus";
import { Image } from "expo-image";
import { InterfaceProps } from ".";
import { useModalStore } from "@/state/stores/modalStore";

type FilesMultiInputProps = InterfaceProps<{
  value?: number[];
  onChange: (value: number[]) => void;
}>;
export const FilesMultiInput = ({
  docId,
  item,
  label,
  error,
  helper,
  value: valueProp = [],
  disabled,
  required,
  ...props
}: FilesMultiInputProps) => {
  const { styles: formControlStyles, theme } = useStyles(formStyles);
  const { directus } = useAuth();
  const [value] = useState<number[]>(valueProp);
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [addedDocIds, setAddedDocIds] = useState<number[]>([]);
  const openFilePicker = useModalStore((state) => state.open);
  const closeFilePicker = useModalStore((state) => state.close);
  const { data: relations } = useRelations();
  const { data: permissions } = usePermissions();
  const { data: fields } = useFields(item?.collection as keyof CoreSchema);

  const junction = relations?.find(
    (r) =>
      r.related_collection === item?.collection &&
      r.meta.one_field === item?.field,
  );

  const sortField = junction?.meta.sort_field;

  const { t } = useTranslation();

  const relation = relations?.find(
    (r) => r.field === junction?.meta.junction_field,
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
    "+",
  );

  const { mutate: addMultipleFiles } = mutateDocuments(
    junction?.collection as keyof CoreSchema,
    "+",
  );

  const add = (id: number | string) => {
    const data = {
      [relation?.field as string]: id,
    };
    mutateOptions(
      data,
      // @ts-ignore
      {
        onSuccess: (newData: any) => {
          setAddedDocIds([...addedDocIds, newData.id]);
          props.onChange([...valueProp, newData.id]);
        },
      },
    );
  };

  const Item = ({
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
    const {
      data: doc,
      isLoading,
      refetch,
      error,
    } = useDocument({
      collection: junction?.meta.many_collection as keyof CoreSchema,
      id: docId,
      options: {
        fields: ["*.*"],
      },
    });

    const { directus, token } = useAuth();

    const file = doc?.[
      junction.meta.junction_field as keyof typeof doc
    ] as unknown as DirectusFile;

    if (error) {
      return (
        <RelatedListItem>
          {(error as DirectusErrorResponse).errors?.[0].message}
        </RelatedListItem>
      );
    }

    return doc && file ? (
      <RelatedListItem
        isDraggable={isSortable}
        isDeselected={isDeselected}
        isNew={isNew}
        prepend={
          <Image
            source={{
              uri: `${directus?.url.origin}/assets/${file.id}`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }}
            style={{ width: 28, height: 28, borderRadius: 4 }}
          />
        }
        append={
          <>
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
        {file.title || file.filename_disk}
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
        <Sortable.Grid
          columns={1}
          rowGap={3}
          data={uniq([...(valueProp || []), ...(value || [])])}
          sortEnabled={!!sortField}
          keyExtractor={(item) => item.toString()}
          onDragEnd={(updatedValue) => {
            console.log({ updatedValue });
            props.onChange(updatedValue.data);
          }}
          renderItem={({ item: id }: { item: number }) => {
            const isDeselected = value?.includes(id) && !valueProp.includes(id);
            const isNew = !valueProp?.includes(id);
            return (
              <Item
                key={id}
                docId={id}
                junction={junction!}
                relation={relation!}
                template={item?.meta.options?.template}
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
                        (item[relation.field as keyof typeof item] as any),
                    ),
                  );
                  props.onChange(valueProp.filter((v) => v !== id));
                }}
                isNew={isNew}
                isDeselected={isDeselected}
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
            {allowCreate && (
              <Modal>
                <Modal.Trigger>
                  <Button>{t("components.shared.createNew")}</Button>
                </Modal.Trigger>
                <Modal.Content>
                  {({ close }) => (
                    <ImageInput
                      sources={["device", "url"]}
                      onChange={(file) => {
                        add(file as string);
                        close();
                      }}
                    />
                  )}
                </Modal.Content>
              </Modal>
            )}

            <Button
              onPress={() => {
                openFilePicker(() => {
                  return (
                    <>
                      <ScrollView
                        contentContainerStyle={{ paddingTop: theme.spacing.lg }}
                      >
                        <FileSelect
                          multiple={true}
                          mimeTypes={
                            (item?.meta.options
                              ?.allowedMimeTypes as string[]) ?? ["*/*"]
                          }
                          onSelect={(files) => {
                            closeFilePicker();
                            addMultipleFiles(
                              (files as string[]).map((f) => ({
                                [relation.field as string]: f,
                              })),
                              // @ts-ignore
                              {
                                onSuccess: (newData: any[]) => {
                                  setAddedDocIds([
                                    ...addedDocIds,
                                    ...newData.map((d) => d.id),
                                  ]);
                                  props.onChange([
                                    ...valueProp,
                                    ...newData.map((d) => d.id),
                                  ]);
                                },
                              },
                            );
                          }}
                        />
                        <View style={{ height: 80 }} />
                      </ScrollView>
                      <FloatingToolbarHost />
                    </>
                  );
                }, t("components.shared.selectFiles"));
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
