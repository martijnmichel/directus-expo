import { CoreSchema, ReadFieldOutput, updateItem } from "@directus/sdk";
import { Controller, Form, FormProvider, useForm } from "react-hook-form";
import { useStyles } from "react-native-unistyles";
import { Button } from "../display/button";
import { Fragment, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCollection,
  useDocument,
  useFields,
} from "@/state/queries/directus/collection";
import { View } from "react-native";
import { Check, Trash } from "../icons";
import { coreCollections } from "@/state/queries/directus/core";
import { mutateDocument } from "@/state/actions/mutateItem";
import { ModalContext } from "../display/modal";
import { PortalOutlet } from "../layout/Portal";
import { Horizontal } from "../layout/Stack";
import { Accordion } from "../display/accordion";
import { each, filter, find, isEmpty, map } from "lodash";
import { queryClient } from "@/utils/react-query";
import { DirectusErrorResponse } from "@/types/directus";
import { mapFields } from "@/helpers/document/mapFields";
import { formStyles } from "../interfaces/style";
import { Stack } from "expo-router";
export const DocumentEditor = ({
  collection,
  id,
  defaultValues = {},
  onSave,
}: {
  collection: keyof CoreSchema;
  id?: number | string;
  defaultValues?: Record<string, unknown>;
  onSave?: (doc: Record<string, unknown>) => void;
  onDelete?: () => void;
}) => {
  const [revision, setRevision] = useState<number>(0);
  const modalContext = useContext(ModalContext);
  const { styles } = useStyles(formStyles);
  const { directus } = useAuth();

  const { data: fields } = useFields(collection as keyof CoreSchema);

  const context = useForm<Record<string, unknown>>();
  const {
    control,
    formState: { isDirty, isValid, isSubmitting, dirtyFields },
  } = context;

  const { data } = useCollection(collection as keyof CoreSchema);
  const {
    data: document,
    error,
    isFetching,
    isError,
  } = useDocument({
    collection: collection as keyof CoreSchema,
    id,
  });

  const { mutateAsync: updateDoc } = mutateDocument(
    collection as keyof CoreSchema,
    id as number
  );

  const fieldComponents = mapFields({ fields, control, docId: id });

  console.log({ isDirty, isValid, isSubmitting });

  const getDocumentFieldValues = (doc?: Record<string, unknown>) => {
    return fields?.reduce((acc, field) => {
      acc[field.field as keyof CoreSchema] =
        doc?.[field.field as keyof CoreSchema];
      return acc;
    }, {} as Record<string, unknown>);
  };

  useEffect(() => {
    if (isError) {
      console.log({ error });
    }
  }, [isError, error]);

  useEffect(() => {
    /** if a document is fetched, reset the form with the document */
    if (document) {
      context.reset(
        getDocumentFieldValues(document as Record<string, unknown>)
      );
      console.log("reset", document);
      setRevision((state) => state + 1);
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
    values: T
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

    await updateDoc(data, {
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
        const errors = error.errors as DirectusErrorResponse;
        each(errors, (error) => {
          console.log(error);
          context.setError(error.extensions.field, {
            message: error.message,
          });
        });
      },
    });
  };

  const SubmitButton = () => (
    <Button
      rounded
      loading={context.formState.isSubmitting}
      disabled={
        !context.formState.isDirty ||
        !context.formState.isValid ||
        context.formState.isSubmitting
      }
      onPress={context.handleSubmit(handleSubmit)}
    >
      <Check />
    </Button>
  );

  if (isFetching) {
    return null;
  }
  return (
    <FormProvider key={revision + collection + id} {...context}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Horizontal>
              <Button rounded variant="soft">
                <Trash />
              </Button>
              <SubmitButton />
            </Horizontal>
          ),
        }}
      />
      <PortalOutlet name="modal-header">
        <SubmitButton />
      </PortalOutlet>
      <View style={styles.form}>{fieldComponents}</View>
    </FormProvider>
  );
};
