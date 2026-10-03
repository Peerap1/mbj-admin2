import { useEffect, useState } from "react";

export default function usePagination(items, pageSize = 50, filterKey = "") {
  const [selection, setSelection] = useState({ key: filterKey, page: 1 });
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = selection.key === filterKey ? Math.min(selection.page, totalPages) : 1;
  useEffect(() => {
    setSelection((previous) =>
      previous.key === filterKey && previous.page === page ? previous : { key: filterKey, page },
    );
  }, [filterKey, page]);
  const offset = (page - 1) * pageSize;
  return {
    items: items.slice(offset, offset + pageSize),
    offset,
    page,
    totalPages,
    total: items.length,
    pageSize,
    onPageChange: (next) =>
      setSelection({ key: filterKey, page: Math.max(1, Math.min(next, totalPages)) }),
  };
}
