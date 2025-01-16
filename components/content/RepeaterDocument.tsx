import { View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { formStyles } from "../interfaces/style";
import { FormProvider, useForm } from "react-hook-form";
import { mapFields } from "@/helpers/document/mapFields";
import { PortalOutlet } from "../layout/Portal";
import { Horizontal } from "../layout/Stack";
import { Trash } from "../icons";
import { Stack } from "expo-router";
import { Button } from "../display/button";

export const RepeaterDocument = ({ fields }: { fields: any[] }) => {
  const { styles } = useStyles(formStyles);
  const context = useForm();
  return (
    <FormProvider {...context}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Horizontal>
              <Button rounded variant="soft">
                <Trash />
              </Button>
            </Horizontal>
          ),
        }}
      />
      <View style={styles.form}>
        {mapFields({ fields, control: context.control })}
      </View>
    </FormProvider>
  );
};
