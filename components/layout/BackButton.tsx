import { Button } from "../display/button";

import { useRouter } from "expo-router";
import { ArrowBack } from "../icons";

export const BackButton = () => {
  const router = useRouter();
  return (
    <Button variant="soft" rounded onPress={() => router.back()}>
      <ArrowBack />
    </Button>
  );
};
