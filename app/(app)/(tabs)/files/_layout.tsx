import { Button } from "@/components/display/button";
import { Modal } from "@/components/display/modal";
import { Plus } from "@/components/icons";
import { ImageInput } from "@/components/interfaces/image-input";
import { BackButton } from "@/components/layout/BackButton";
import { Horizontal } from "@/components/layout/Stack";
import { isActionAllowed } from "@/helpers/permissions/isActionAllowed";
import { useTrackPath } from "@/hooks/useTrackPath";
import { usePermissions } from "@/state/queries/directus/core";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import { Slot, Stack } from "expo-router";

export default function Layout() {
  const headerStyles = useHeaderStyles();

  return (
    <Stack>
      <Slot />
    </Stack>
  );
}
