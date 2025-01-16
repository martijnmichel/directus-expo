import { Button } from "../display/button";

import { RelativePathString, useRouter } from "expo-router";
import { ArrowBack } from "../icons";
import { useTrackedPath } from "@/hooks/useTrackPath";

export const BackButton = () => {
  const router = useRouter();
  const { data, back } = useTrackedPath();
  return (
    <Button
      variant="soft"
      rounded
      onPress={() => back()}
      disabled={!data?.paths.length}
    >
      <ArrowBack />
    </Button>
  );
};
