import { CoreSchema, ReadFieldOutput, updateItem } from "@directus/sdk";
import {
  Controller,
  Form,
  FormProvider,
  useForm,
  useWatch,
} from "react-hook-form";
import { useStyles } from "react-native-unistyles";
import { Button } from "../display/button";
import { Fragment, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCollection,
  useDocument,
  useFields,
} from "@/state/queries/directus/collection";
import { useRelations } from "@/state/queries/directus/core";
import { Alert, Platform, View } from "react-native";
import { Check, Trash } from "../icons";
import {
  coreCollections,
  useItemPermissions,
  usePermissions,
} from "@/state/queries/directus/core";
import { ModalContext } from "../display/modal";
import { PortalOutlet } from "../layout/Portal";
import { Horizontal } from "../layout/Stack";
import { Accordion } from "../display/accordion";
import { each, filter, find, isEmpty, map, merge } from "lodash";
import { queryClient } from "@/utils/react-query";
import { DirectusErrorResponse } from "@/types/directus";
import { mapFields } from "@/helpers/document/mapFields";
import { formStyles } from "../interfaces/style";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text } from "../display/typography";
import { deleteDocument } from "@/state/actions/deleteDocument";
import { mutateDocument } from "@/state/actions/updateDocument";
import { isActionAllowed } from "@/helpers/permissions/isActionAllowed";
import ToastManager from "@/utils/toast";
import { useUUID } from "@/hooks/useUUID";
import { RelatedItemState } from "@/utils/mitt";

export const DocumentEditor = ({
  collection,
  id,
  defaultValues = undefined,
  onSave,
  onChange,
  onDelete,
  submitType = "submit",
}: {
  collection: keyof CoreSchema;
  id?: number | string | "+";
  defaultValues?: Record<string, unknown>;
  onSave?: (doc: Record<string, unknown>) => void;
  onChange?: (doc: Record<string, unknown>) => void;
  onDelete?: () => void;
  submitType?: "submit" | "raw" | "inline";
}) => {
  const uuid = useUUID();
  const { token } = useAuth();
  const { t } = useTranslation();
  const { data: fields } = useFields(collection as keyof CoreSchema);
  const { data: relations } = useRelations();

  const { data: itemPermissions } = useItemPermissions(
    collection as keyof CoreSchema,
    id as number,
  );

  const { styles } = useStyles(formStyles);

  const { data: permissions } = usePermissions();
  const context = useForm<Record<string, unknown>>({ defaultValues });
  const {
    control,
    watch,
    formState: { isDirty, isValid, isSubmitting, dirtyFields },
  } = context;
  const fieldComponents = mapFields({
    fields,
    relations,
    control,
    docId: id,
    canUpdateItem: itemPermissions?.update.access,
    permissions,
    styles,
    uuid,
    t,
  });

  const form = useWatch({ control });

  useEffect(() => {
    if (isDirty) {
      onChange?.(form);
    }
  }, [form, isDirty]);

  const [revision, setRevision] = useState<number>(0);
  const modalContext = useContext(ModalContext);
  const { mutate: deleteDoc, isPending: isDeleting } = deleteDocument(
    collection as keyof CoreSchema,
    id as number,
  );

  const { data } = useCollection(collection as keyof CoreSchema);
  const {
    data: document,
    error,
    isFetching,
    isError,
  } = useDocument({
    collection: collection as keyof CoreSchema,
    id,
    query: {
      enabled: id !== "+" && !defaultValues,
    },
  });

  const { mutateAsync: updateDoc } = mutateDocument(
    collection as keyof CoreSchema,
    id as number,
  );

  const getDocumentFieldValues = (document: Record<string, unknown>) => {
    return Object.keys(document).reduce(
      (acc, key) => {
        acc[key] = document[key] === null ? "" : document[key];
        return acc;
      },
      {} as Record<string, unknown>,
    );
  };

  useEffect(() => {
    //console.log("defaultValues", defaultValues);
    // if (defaultValues) return;
    /** if a document is fetched, reset the form with the document */
    if (document) {
      context.reset(
        getDocumentFieldValues(
          merge(document, defaultValues) as Record<string, unknown>,
        ),
      );
      //console.log("reset", document);
      //setRevision((state) => state + 1);
    }
  }, [document]);

  type DirtyFieldsType =
    | boolean
    | null
    | {
        [key: string]: DirtyFieldsType;
      }
    | DirtyFieldsType[];

  function getDirtyValues<T extends Record<string, any>>(
    dirtyFields: Partial<Record<keyof T, DirtyFieldsType>>,
    values: T,
  ): Partial<T> {
    const dirtyValues = Object.keys(dirtyFields).reduce((prev, key) => {
      const value = dirtyFields[key];
      if (!value) {
        return prev;
      }
      const isObject = typeof value === "object";
      const isArray = Array.isArray(value);
      const nestedValue =
        isObject && !isArray
          ? getDirtyValues(value as Record<string, any>, values[key])
          : values[key];
      return { ...prev, [key]: isArray ? values[key] : nestedValue };
    }, {} as Partial<T>);
    return dirtyValues;
  }

  const handleSubmit = async (body: Record<string, unknown>) => {
    const data = getDirtyValues(dirtyFields, body);

    switch (submitType) {
      case "raw":
        onSave?.(data);
        break;
      case "submit": {
        /**
         * Transforms the form data to the Directus API detailed relationship format from __state fields
         * @param value - The value to transform
         * @returns
         */
        const transformFormData = (value: unknown): unknown => {
          if (value === null || typeof value !== "object") {
            return value;
          }
          if (Array.isArray(value)) {
            return value
              .filter((item) => {
                if (item && typeof item === "object" && !Array.isArray(item)) {
                  return item.__state !== RelatedItemState.Deleted;
                }
                return true;
              })
              .map((item) => transformFormData(item));
          }
          const obj = value as Record<string, unknown>;
          if (obj.__state === RelatedItemState.Deleted) {
            return undefined;
          }
          return Object.keys(obj).reduce(
            (acc, key) => {
              if (key.startsWith("__") || key === "null") {
                return acc;
              }
              const cleaned = transformFormData(obj[key]);
              if (cleaned === undefined) {
                return acc;
              }
              return { ...acc, [key]: cleaned };
            },
            {} as Record<string, unknown>,
          );
        };

        const cleanedData = transformFormData(data) as Record<string, unknown>;

        await updateDoc(cleanedData, {
          onSuccess: (updatedDoc) => {
            context.reset(updatedDoc);

            onSave?.(updatedDoc as Record<string, unknown>);

            queryClient.invalidateQueries({
              queryKey: ["document", collection, id],
            });
            queryClient.invalidateQueries({
              queryKey: ["documents", collection],
            });
          },
          onError: (error: any) => {
            const e = error as DirectusErrorResponse;
            each(e.errors, (error) => {
              context.setError(error.extensions.field, {
                message: error.message,
              });
              ToastManager.error({
                message: "Error updating document",
                description: error.message,
              });
            });
          },
        });
        break;
      }
    }
  };

  const handleDelete = () => {
    // Implement delete functionality with confirmation dialog
    Alert.alert(
      t("common.delete"),
      t("widget.removeMessage", { name: collection }),
      [
        { text: t("button.cancel"), style: "cancel" },
        {
          text: t("widget.removeButton"),
          style: "destructive",
          onPress: () => {
            deleteDoc(undefined, {
              onSuccess: () => {
                onDelete?.();
              },
            });
          },
        },
      ],
    );
  };

  const handleSave = () => {
    context.handleSubmit(handleSubmit)();
  };

  if (isFetching) {
    return null;
  }
  return (
    <FormProvider key={revision + collection + id} {...context}>
      {submitType !== "inline" && (
        <Stack.Screen
          options={{
            headerRight: () => (
              <Horizontal>
                {itemPermissions?.delete.access && id !== "+" && (
                  <Button
                    rounded
                    variant="soft"
                    size="sm"
                    onPress={handleDelete}
                    loading={isDeleting}
                  >
                    <Trash />
                  </Button>
                )}
                <Button
                  rounded
                  disabled={!isDirty || !isValid || isSubmitting}
                  loading={isSubmitting}
                  size="sm"
                  onPress={handleSave}
                >
                  <Check />
                </Button>
              </Horizontal>
            ),
          }}
        />
      )}
      {/** <PortalOutlet name="modal-header">
        <Button rounded onPress={handleSave}>
          <Check />
        </Button>
      </PortalOutlet> */}

      {Platform.OS === "web" && submitType !== "submit" && __DEV__ && (
        <Horizontal style={{ justifyContent: "flex-end", paddingBottom: 10 }}>
          {itemPermissions?.delete.access && id !== "+" && (
            <Button
              rounded
              variant="soft"
              size="sm"
              onPress={handleDelete}
              loading={isDeleting}
            >
              <Trash />
            </Button>
          )}
          <Button
            rounded
            disabled={!isDirty || !isValid || isSubmitting}
            loading={isSubmitting}
            size="sm"
            onPress={handleSave}
          >
            <Check />
          </Button>
        </Horizontal>
      )}

      <View style={styles.form}>{fieldComponents}</View>
    </FormProvider>
  );
};
