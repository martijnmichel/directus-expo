import { useEffect } from "react";
import { Input } from "@/components/interfaces/input";
import { debounce } from "lodash";
import { useState } from "react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/display/modal";
import { Button } from "@/components/display/button";
import { DirectusIcon } from "@/components/display/directus-icon";
import { Horizontal, Vertical } from "@/components/layout/Stack";
import { UseDocumentsFiltersReturn } from "@/hooks/useDocumentsFilters";
import { Check, X } from "@/components/icons";

export const SearchFilter = (state: UseDocumentsFiltersReturn) => {
  const [search, setSearch] = useState(state.search);
  const { t } = useTranslation();
  const handleSearch = useCallback(
    debounce(() => state.setSearch(search), 500),
    [state.setSearch, search]
  );

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  return (
    <Modal>
      <Modal.Trigger>
        <Button rounded floating variant={state.search ? "primary" : "soft"}>
          <DirectusIcon name="search" />
        </Button>
      </Modal.Trigger>
      <Modal.Content variant="quickView" title={t("components.table.search")}>
        {({ close }) => (
          <Vertical>
            <Input
              value={search}
              onChangeText={setSearch}
              append={<DirectusIcon name="search" />}
              placeholder="Search"
            />
            <Horizontal style={{ justifyContent: "flex-end" }}>
              {!!search && (
                <Button
                  rounded
                  variant="soft"
                  onPress={() => (setSearch(""), close())}
                >
                  <X />
                </Button>
              )}

              <Button rounded onPress={close}>
                <Check />
              </Button>
            </Horizontal>
          </Vertical>
        )}
      </Modal.Content>
    </Modal>
  );
};
