import { useCollection, usePresets } from "@/state/queries/directus/collection";
import { debounce, map, reduce } from "lodash";
import { Table } from "../display/table";
import { Container } from "../layout/Container";
import { useFields } from "@/state/queries/directus/collection";
import { useDocuments } from "@/state/queries/directus/collection";
import { CoreSchema } from "@directus/sdk";
import { useTranslation } from "react-i18next";
import { useFieldMeta } from "@/helpers/document/fieldLabel";
import { router, usePathname } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { UseQueryResult } from "@tanstack/react-query";
import { Horizontal, Vertical } from "../layout/Stack";
import { ChevronRight } from "../icons";
import { Button } from "../display/button";
import { DirectusIcon } from "../display/directus-icon";
import { PortalOutlet } from "../layout/Portal";
import { Modal } from "../display/modal";
import { Input } from "../interfaces/input";

const useDocumentsFilters = () => {
  const [page, setPage] = useState(1);
  const [limit, updateLimit] = useState(25);
  const [search, setSearch] = useState("");

  const next = () => {
    setPage(page + 1);
  };

  const previous = () => {
    setPage(page - 1);
  };

  const setLimit = (limit: number) => {
    setPage(1);
    updateLimit(limit);
  };

  return { page, limit, next, previous, setLimit, search, setSearch };
};

const Pagination = (
  context: ReturnType<typeof useDocumentsFilters> & {
    total: number | null | undefined;
  }
) => {
  return (
    <Horizontal>
      <Button
        rounded
        disabled={context.page === 1}
        variant="soft"
        onPress={context.previous}
      >
        <DirectusIcon name="chevron_left" />
      </Button>
      <Button
        rounded
        disabled={
          context.page === Math.ceil((context.total || 0) / context.limit)
        }
        variant="soft"
        onPress={context.next}
      >
        <DirectusIcon name="chevron_right" />
      </Button>
    </Horizontal>
  );
};

const SearchFilter = (context: ReturnType<typeof useDocumentsFilters>) => {
  const [search, setSearch] = useState(context.search);

  const handleSearch = useCallback(
    debounce(() => context.setSearch(search), 500),
    [context.setSearch, search]
  );

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  return (
    <Modal>
      <Modal.Trigger>
        <Button rounded variant="soft">
          <DirectusIcon name="search" />
        </Button>
      </Modal.Trigger>
      <Modal.Content>
        <Input value={search} onChangeText={setSearch} placeholder="Search" />
      </Modal.Content>
    </Modal>
  );
};

export function CollectionDataTable({ collection }: { collection: string }) {
  const { t } = useTranslation();
  const { data } = useCollection(collection as keyof CoreSchema);
  const { data: fields } = useFields(collection as keyof CoreSchema);
  const path = usePathname();

  const filterContext = useDocumentsFilters();
  const { page, limit, search, setSearch } = filterContext;

  const { data: documents, refetch } = useDocuments(
    collection as keyof CoreSchema[keyof CoreSchema],
    {
      page,
      limit,
      search,
    }
  );

  const { label } = useFieldMeta(collection);

  const { data: presets } = usePresets();

  const preset = presets?.find((p) => p.collection === collection);

  const tableFields =
    (preset && preset.layout_query?.tabular?.fields) ||
    fields?.map((f) => f.field) ||
    [];

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <Vertical>
      <Table
        headers={reduce(
          tableFields,
          (prev, curr) => ({ ...prev, [curr]: label(curr) || "" }),
          {}
        )}
        fields={tableFields}
        items={(documents?.items as Record<string, unknown>[]) || []}
        widths={preset?.layout_options?.tabular?.widths}
        renderRow={(doc) =>
          map(tableFields, (f) => doc[f] as number | string | null)
        }
        onRowPress={(doc) => {
          console.log(doc);
          router.push(`/content/${collection}/${doc.id}`);
        }}
        noDataText={t("components.table.noData")}
      />
      <PortalOutlet name="floating-toolbar" path={/^\/content\/[^/]+$/}>
        <Pagination {...filterContext} total={documents?.total} />
        <SearchFilter {...filterContext} />
      </PortalOutlet>
    </Vertical>
  );
}
