import { useNavigation, usePathname } from "expo-router";
import { useState, useMemo, useEffect, useCallback } from "react";

const defaults = {
  page: 1,
  limit: 25,
  search: "",
};

export type UseDocumentsFiltersReturn = ReturnType<typeof useDocumentsFilters>;

export const useDocumentsFilters = () => {
  const [page, setPage] = useState(defaults.page);
  const [limit, updateLimit] = useState(defaults.limit);
  const [search, setSearch] = useState(defaults.search);
  const path = usePathname();

  const next = () => {
    setPage(page + 1);
  };

  const previous = () => {
    setPage(page - 1);
  };

  const setLimit = (newLimit: number) => {
    setPage(defaults.page);
    updateLimit(newLimit);
  };

  useEffect(() => {
    console.log("path reset filters", path);
    setPage(defaults.page);
    updateLimit(defaults.limit);
    setSearch(defaults.search);
  }, [path]);

  return { page, limit, next, previous, setLimit, search, setSearch };
};
