import { createContext, useContext, useState, useMemo } from "react";

export type UseDocumentsFiltersReturn = ReturnType<typeof useDocumentsFilters>;

export const useDocumentsFilters = () => {
  const [page, setPage] = useState(1);
  const [limit, updateLimit] = useState(5);
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
