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
import { getFieldPathsFromTemplate, parseTemplate, parseTemplateParts } from "@/helpers/document/template";
import { TemplatePartsRenderer } from "../content/TemplatePartsRenderer";

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
          props.onChange([
            ...value,
            {
              __id: newData.id.toString(),
              __state: RelatedItemState.Created,
              [relation?.field as string]: newData.id,
            },
          ]);
        },
      },
    );
  };

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
    ...templatePaths,
  ]).filter(Boolean).filter(s => !s?.includes("$"));

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
    junction?.collection as keyof CoreSchema,
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
            const isDeselected = junctionDoc.__state === RelatedItemState.Deleted;
            const isNew = junctionDoc.__state === RelatedItemState.Created;
            const isPicked = junctionDoc.__state === RelatedItemState.Picked;
            const isUpdated = junctionDoc.__state === RelatedItemState.Updated;
            const isDefault = junctionDoc.__state === RelatedItemState.Default;

            const doc = relatedDocs?.items?.find(
              (v) => String(v.id) === String(junctionDoc.__id),
            );

            const draftValue = doc ? (doc as any) : undefined;


            const partsFromDoc = parseTemplateParts(effectiveTemplate, doc, fields);
            const partsFromValue = parseTemplateParts(effectiveTemplate, draftValue, fields);

            console.log({ partsFromDoc, partsFromValue, relatedDocs, doc, value, item, junctionDoc, junction, junctionField, prefixedTemplatePaths, requestFields, interfaceTemplate, effectiveTemplate });

            return (
              <RelatedListItem
                isNew={isNew}
                isUpdated={isUpdated}
                isDeselected={isDeselected}
                isPicked={isPicked}
                isDraggable={!!sortField}
                append={
                  <Button variant="ghost" rounded>
                    <DirectusIcon name="close" />
                  </Button>
                }
              >
                <TemplatePartsRenderer parts={partsFromValue} />
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
