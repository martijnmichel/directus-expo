import { useNavigation, usePathname } from "expo-router";
import { useState, useMemo, useEffect, useCallback } from "react";

const defaults = {
  page: 1,
  limit: 25,
  search: "",
};

export type UseDocumentsFiltersReturn = ReturnType<typeof useDocumentsFilters>;

export const useDocumentsFilters = (opts?: typeof defaults) => {
  const [page, setPage] = useState(opts?.page || defaults.page);
  const [limit, updateLimit] = useState(opts?.limit || defaults.limit);
  const [search, setSearch] = useState(opts?.search || defaults.search);
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

  const reset = () => {
    setPage(defaults.page);
    updateLimit(defaults.limit);
    setSearch(defaults.search);
  };

  useEffect(() => {
    console.log("path reset filters", path);
    setPage(defaults.page);
    updateLimit(defaults.limit);
    setSearch(defaults.search);
  }, [path]);

  return { page, limit, next, previous, setLimit, search, setSearch, reset };
};
