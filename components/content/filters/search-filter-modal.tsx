import { useEffect } from "react";
import { Input } from "@/components/interfaces/input";
import { useDocumentsFilters } from "@/contexts/FilterContext";
import { debounce } from "lodash";
import { useState } from "react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/display/modal";
import { Button } from "@/components/display/button";
import { DirectusIcon } from "@/components/display/directus-icon";
import { Vertical } from "@/components/layout/Stack";

export const SearchFilter = () => {
  const { state, actions } = useDocumentsFilters();
  const [search, setSearch] = useState(state.search);
  const { t } = useTranslation();
  const handleSearch = useCallback(
    debounce(() => actions.setSearch(search), 500),
    [actions.setSearch, search]
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
      <Modal.Content variant="quickView" title={t("components.table.search")}>
        <Vertical>
          <Input value={search} onChangeText={setSearch} placeholder="Search" />
        </Vertical>
      </Modal.Content>
    </Modal>
  );
};
