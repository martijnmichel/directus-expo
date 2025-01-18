import { Horizontal } from "@/components/layout/Stack";
import { Button } from "@/components/display/button";
import { DirectusIcon } from "@/components/display/directus-icon";
import { Text } from "@/components/display/typography";
import { UseDocumentsFiltersReturn } from "@/hooks/useDocumentsFilters";

export const Pagination = (
  context: UseDocumentsFiltersReturn & { total?: number }
) => {
  const { page, limit, next, previous } = context;
  const totalPages = Math.ceil((context.total || 0) / limit);
  return (
    <Horizontal>
      <Button rounded disabled={page === 1} variant="soft" onPress={previous}>
        <DirectusIcon name="chevron_left" />
      </Button>

      <Button
        rounded
        disabled={page === totalPages}
        variant="soft"
        onPress={next}
      >
        <DirectusIcon name="chevron_right" />
      </Button>
    </Horizontal>
  );
};
