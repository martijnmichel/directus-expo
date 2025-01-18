import { useDocumentsFilters } from "@/contexts/FilterContext";
import { Horizontal } from "@/components/layout/Stack";
import { Button } from "@/components/display/button";
import { DirectusIcon } from "@/components/display/directus-icon";
import { Text } from "@/components/display/typography";

export const Pagination = (context: { total: number | null | undefined }) => {
  const {
    state: { page, limit },
    actions: { next, previous },
  } = useDocumentsFilters();
  const totalPages = Math.ceil((context.total || 0) / limit);
  return (
    <Horizontal>
      <Button rounded disabled={page === 1} variant="soft" onPress={previous}>
        <DirectusIcon name="chevron_left" />
      </Button>

      <Text>{page}</Text>

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
