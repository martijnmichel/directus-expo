import { CoreSchema, updateItem } from "@directus/sdk";
import { Controller, Form, FormProvider, useForm } from "react-hook-form";
import { useStyles } from "react-native-unistyles";
import { formStyles } from "../form/style";
import { Button } from "../display/button";
import { Fragment, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../display/collapsible";
import { ReactNode } from "react";
import { ChevronRight } from "../icons/Chevron";
import { Input } from "../form/input";
import { useAuth } from "@/contexts/AuthContext";
import { mutateDoc } from "@/state/actions/updateDoc";
import {
  useCollection,
  useDocument,
  useFields,
} from "@/state/queries/directus/collection";
import { Select } from "../form/select";
import { TextArea } from "../form/textarea";
import { RichText } from "../form/richtext";
export const DocumentEditor = ({
  collection,
  id,
}: {
  collection: keyof CoreSchema;
  id: number;
}) => {
  const { styles } = useStyles(formStyles);
  const { directus } = useAuth();
  const context = useForm<CoreSchema<keyof CoreSchema>>({ defaultValues: {} });
  const { control } = context;

  const { data } = useCollection(collection as keyof CoreSchema);
  const { data: document } = useDocument(collection as keyof CoreSchema, id);
  const { data: fields } = useFields(collection as keyof CoreSchema);
  const { mutateAsync: updateDoc } = mutateDoc(
    collection as keyof CoreSchema,
    id
  );

  useEffect(() => {
    if (document) {
      context.reset(document);
    }
  }, [document]);

  const getLabel = (field: string) =>
    fields
      ?.find((f) => f.field === field)
      ?.meta.translations?.find((t) => t.language === "nl-NL")?.translation ||
    field;

  const mapFields = (parent?: string): ReactNode =>
    fields

      ?.sort((a, b) => ((a.meta.sort || 0) < (b.meta.sort || 0) ? -1 : 1))
      .map((item) => {
        if (
          (parent && item.meta.group !== parent) ||
          (!!item.meta.group && !parent)
        ) {
          return null;
        } else if (item.meta.interface === "group-accordion") {
          return (
            <Fragment key={item.field}>{mapFields(item.meta.field)}</Fragment>
          );
        } else if (
          item.meta.interface &&
          ["group-raw", "group-detail"].includes(item.meta.interface)
        ) {
          return (
            <Collapsible key={item.field}>
              <CollapsibleTrigger>
                <ChevronRight />
                {getLabel(item.field)}
              </CollapsibleTrigger>
              <CollapsibleContent style={{ padding: 8 }}>
                {mapFields(item.meta.field)}
              </CollapsibleContent>
            </Collapsible>
          );
        } else if (item.meta.interface === "input") {
          if (item.type === "string") {
            return (
              <Controller
                control={control}
                rules={{ required: item.meta.required }}
                name={item.field as keyof CoreSchema[keyof CoreSchema]}
                render={({ field: { onChange, value } }) => (
                  <Input
                    onChangeText={onChange}
                    value={value as string}
                    placeholder={item.meta.display_options?.placeholder}
                    label={getLabel(item.field)}
                    autoCapitalize="none"
                  />
                )}
              />
            );
          } else if (item.type === "number") {
            return (
              <Controller
                control={control}
                rules={{ required: item.meta.required }}
                name={item.field as keyof CoreSchema[keyof CoreSchema]}
                render={({ field: { onChange, value } }) => (
                  <Input
                    onChangeText={onChange}
                    value={value as string}
                    placeholder={item.meta.display_options?.placeholder}
                    label={getLabel(item.field)}
                    autoCapitalize="none"
                    keyboardType="numeric"
                  />
                )}
              />
            );
          }
        } else if (item.meta.interface === "select-dropdown") {
          return (
            <Controller
              control={control}
              rules={{ required: item.meta.required }}
              name={item.field as keyof CoreSchema[keyof CoreSchema]}
              render={({ field: { onChange, value } }) => (
                <Select
                  options={item.meta.display_options?.choices || []}
                  onValueChange={onChange}
                  value={value as string}
                  placeholder={item.meta.display_options?.placeholder}
                  label={getLabel(item.field)}
                />
              )}
            />
          );
        } else if (item.meta.interface === "input-multiline") {
          return (
            <Controller
              control={control}
              rules={{ required: item.meta.required }}
              name={item.field as keyof CoreSchema[keyof CoreSchema]}
              render={({ field: { onChange, value } }) => (
                <TextArea
                  onChangeText={onChange}
                  value={value as string}
                  placeholder={item.meta.display_options?.placeholder}
                  label={getLabel(item.field)}
                  autoCapitalize="none"
                />
              )}
            />
          );
        } else if (item.meta.interface === "input-rich-text-html") {
          return (
            <Controller
              control={control}
              rules={{ required: item.meta.required }}
              name={item.field as keyof CoreSchema[keyof CoreSchema]}
              render={({ field: { onChange, value } }) => (
                <RichText
                  onChange={onChange}
                  value={value as string}
                  label={getLabel(item.field)}
                />
              )}
            />
          );
        }
      });

  const handleSubmit = async (data: CoreSchema<keyof CoreSchema>) => {
    await updateDoc(data, {
      onSuccess: (updatedDoc) => {
        context.reset(updatedDoc);
      },
    });
  };

  return (
    <FormProvider {...context}>
      <Form style={styles.form}>
        {mapFields()}
        <Button
          loading={context.formState.isSubmitting}
          disabled={
            !context.formState.isDirty ||
            !context.formState.isValid ||
            context.formState.isSubmitting
          }
          onPress={context.handleSubmit(handleSubmit)}
        >
          Save
        </Button>
      </Form>
    </FormProvider>
  );
};
