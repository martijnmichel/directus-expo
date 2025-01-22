import { View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { formStyles } from "../interfaces/style";
import { FormProvider, useForm } from "react-hook-form";
import { mapFields } from "@/helpers/document/mapFields";
import { PortalOutlet } from "../layout/Portal";
import { Horizontal } from "../layout/Stack";
import { Check, Trash } from "../icons";
import { Stack } from "expo-router";
import { Button } from "../display/button";

export const RepeaterDocument = ({
  fields,
  defaultValues,
  onSave,
}: {
  fields: any[];
  defaultValues?: Record<string, any>;
  onSave?: (data: Record<string, any>) => void;
}) => {
  const { styles } = useStyles(formStyles);
  const context = useForm({ defaultValues });

  const handleSubmit = (data: Record<string, any>) => {
    onSave?.(data);
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

  return (
    <FormProvider {...context}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Horizontal>
              <SubmitButton />
            </Horizontal>
          ),
        }}
      />
      <View style={styles.form}>
        {mapFields({
          fields,
          control: context.control,
        })}
      </View>
    </FormProvider>
  );
};
