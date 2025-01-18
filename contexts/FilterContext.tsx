import { createContext, useContext, useState, useMemo } from "react";

interface FilterContextType {
  state: {
    page: number;
    limit: number;
    search: string;
  };
  actions: {
    next: () => void;
    previous: () => void;
    setLimit: (limit: number) => void;
    setSearch: (search: string) => void;
  };
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: React.ReactNode }) => {
  const [page, setPage] = useState(1);
  const [limit, updateLimit] = useState(5);
  const [search, updateSearch] = useState("");

  const next = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const previous = () => {
    setPage((prevPage) => Math.max(1, prevPage - 1));
  };

  const setLimit = (limit: number) => {
    setPage(1);
    updateLimit(limit);
  };

  const setSearch = (search: string) => {
    setPage(1);
    updateSearch(search);
  };

  const value = useMemo(
    () => ({
      state: { page, limit, search },
      actions: { next, previous, setLimit, setSearch },
    }),
    [page, limit, search]
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
};

export const useDocumentsFilters = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useDocumentsFilters must be used within a FilterProvider");
  }
  return context;
};
