import { useNavigation, usePathname } from "expo-router";
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";

export type UseDocumentsFiltersReturn = ReturnType<typeof useDocumentsFilters>;

export const useDocumentsFilters = () => {
  const [page, setPage] = useState(1);
  const [limit, updateLimit] = useState(5);
  const [search, setSearch] = useState("");
  const path = usePathname();

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

  useEffect(() => {
    console.log("path reset filters", path);
    setPage(1);
    updateLimit(5);
    setSearch("");
  }, [path]);

  return { page, limit, next, previous, setLimit, search, setSearch };
};
