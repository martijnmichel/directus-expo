import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  useCollection,
  useDocument,
  useDocuments,
  useFields,
} from "@/state/queries/directus/collection";
import { useFiles, usePermissions, useRelations } from "@/state/queries/directus/core";
import { formStyles } from "./style";
import { get, map, uniq } from "lodash";
import {
  Link,
  RelativePathString,
  router,
  useLocalSearchParams,
} from "expo-router";
import { Horizontal, Vertical } from "../layout/Stack";
import EventBus, {
  MittEvents,
  RelatedItem,
  RelatedItemState,
} from "@/utils/mitt";
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
import { getPrimaryKey } from "@/hooks/usePrimaryKey";
import {
  getFieldPathsFromTemplate,
  parseTemplate,
  parseTemplateParts,
} from "@/helpers/document/template";
import { TemplatePartsRenderer } from "../content/TemplatePartsRenderer";
import { Thumbnail } from "../content/Thumbnail";
import { formatFileSize } from "@/helpers/formatFileSize";

type FilesMultiInputProps = InterfaceProps<{
  value?: number[] | RelatedItem[];
  onChange: (value: RelatedItem[]) => void;
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
  if (!item) {
    console.warn(`FilesMultiInput ${label}: item is required`);
    return null;
  }

  const openFilePicker = useModalStore((state) => state.open);
  const closeFilePicker = useModalStore((state) => state.close);
  const { styles: formControlStyles, theme } = useStyles(formStyles);
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

  const { mutate: mutateOptions } = mutateDocument(
    junction?.collection as keyof CoreSchema,
    "+",
  );

  const requestFields = uniq([
    pk,
    junctionField,
    `${junctionField}.${relatedPrimaryKey}`,
    `${junctionField}.title`,
    `${junctionField}.filename_disk`,
    `${junctionField}.type`,
    `${junctionField}.filesize`,
  ])
    .filter(Boolean)
    .filter((s) => !s?.includes("$"));

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
        filteredJunctionIds.length > 0 &&
        !!relatedPrimaryKey &&
        !!junctionField &&
        !!pk,
    },
  );

  const newFilesIds = value.filter((v) => v.__state === RelatedItemState.Created).map((v) => v.__id);

  const { data:newDocs } = useFiles({
    filter: {
      id: { _in: newFilesIds.length > 0 ? newFilesIds : undefined },
    },
    fields: ["id", "filename_disk", "title", "type", "filesize"],
  
   
  });

  const RenderItem = ({
    file: { filename_disk, title, type, filesize, id },
  }: {
    file: DirectusFile;
  }) => {
    return (
      <Horizontal spacing="sm" style={{ flex: 1 }}>
        {type?.startsWith("image/") && <Thumbnail id={id} />}
        <Vertical style={{ flex: 1, gap: 0 }}>
          <Text numberOfLines={1} style={{ flex: 1 }}>
            {filename_disk || title}
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.secondaryText }}>
            {type}
          </Text>
        </Vertical>
        <Text style={{ fontSize: 12, color: theme.colors.secondaryText }}>
          {formatFileSize(
            typeof filesize === "number" ? filesize : (Number(filesize) ?? 0),
          )}
        </Text>
      </Horizontal>
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
          sortEnabled={!!sortField}
          keyExtractor={(item) => item.__id}
          data={value}
          onDragEnd={(updatedValue) => {
            console.log({ updatedValue });
            props.onChange(updatedValue.data);
          }}
          renderItem={({ item: junctionDoc }: { item: RelatedItem }) => {
            const isDeselected =
              junctionDoc.__state === RelatedItemState.Deleted;
            const isNew = junctionDoc.__state === RelatedItemState.Created;
            const isPicked = junctionDoc.__state === RelatedItemState.Picked;
            const isUpdated = junctionDoc.__state === RelatedItemState.Updated;
            const isDefault = junctionDoc.__state === RelatedItemState.Default;

            const junctionDocFromDB = relatedDocs?.items?.find(
              (v) => String(v.id) === String(junctionDoc.__id),
            );

            const newDoc = newDocs?.items?.find(
              (v) => String(v.id) === String(junctionDoc.__id),
            );

            const doc = !!junctionDocFromDB
              ? (junctionDocFromDB as any)[relation?.field as string]
              : undefined;

            /**console.log({
              relatedDocs,
              doc,
              value,
              item,
              junctionDoc,
              junction,
              junctionField,
              prefixedTemplatePaths,
              requestFields,
              interfaceTemplate,
              effectiveTemplate,
              newDocs,
              newFilesIds,
              newDoc,
              junctionDocFromDB,
            }); */

            return (
              <RelatedListItem
                isNew={isNew}
                isUpdated={isUpdated}
                isDeselected={isDeselected}
                isPicked={isPicked}
                isDraggable={!!sortField}
                append={
                  <Button
                    variant="ghost"
                    rounded
                    onPress={() => {
                      if (isNew) {
                        props.onChange(
                          value.filter((v) => v.__id !== junctionDoc.__id),
                        );
                      } else {
                        if (isDeselected) {
                          props.onChange(
                            value.map((v) =>
                              v.__id === junctionDoc.__id
                                ? { ...v, __state: RelatedItemState.Default }
                                : v,
                            ),
                          );
                        } else {
                          props.onChange(
                            value.map((v) =>
                              v.__id === junctionDoc.__id
                                ? { ...v, __state: RelatedItemState.Deleted }
                                : v,
                            ),
                          );
                        }
                      }
                    }}
                  >
                    {isNew ? (
                      <DirectusIcon name="close" />
                    ) : isDeselected ? (
                      <DirectusIcon name="settings_backup_restore" />
                    ) : (
                      <DirectusIcon name="close" />
                    )}
                  </Button>
                }
              >
               {(!!doc || !!newDoc) ? <RenderItem file={doc ?? newDoc} /> : null}
              </RelatedListItem>
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
                        close();
                        console.log({ file });
                        if (file) {
                          props.onChange([
                            ...value,
                            {
                              __id: file.toString(),
                              __state: RelatedItemState.Created,
                              [junctionField]: { id: file },
                              [relation?.field as string]: file,
                            },
                          ]);
                        }
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

                            props.onChange([
                              ...value,
                              ...(files as string[]).map((id: string) => ({
                                [junctionField]: { id },
                                __id: id.toString(),
                                __state: RelatedItemState.Created,
                                ...(sortField
                                  ? { [sortField]: value.length + 1 }
                                  : {}),
                              })),
                            ]);
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
