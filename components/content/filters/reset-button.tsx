import { Button } from "@/components/display/button";
import { X } from "@/components/icons";
import {
  useDocumentsFilters,
  UseDocumentsFiltersReturn,
} from "@/hooks/useDocumentsFilters";

export const ResetButton = (context: UseDocumentsFiltersReturn) => {
  return context.search ? (
    <Button rounded variant="soft" colorScheme="error" onPress={context.reset}>
      <X />
    </Button>
  ) : null;
};
