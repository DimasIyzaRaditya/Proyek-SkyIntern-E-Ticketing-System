"use client";

import { useMemo } from "react";

type CompactPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  tone?: "blue" | "emerald";
};

export default function CompactPagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  tone = "blue",
}: CompactPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const activeClass = tone === "emerald"
    ? "border-emerald-600 bg-emerald-600 text-white"
    : "border-blue-600 bg-blue-600 text-white";

  const pageItems = useMemo(() => {
    const pages = Array.from({ length: safeTotalPages }, (_, index) => index + 1)
      .filter((page) => page === 1 || page === safeTotalPages || Math.abs(page - safeCurrentPage) <= 1);

    return pages.reduce<(number | "...")[]>((acc, page, index, arr) => {
      if (index > 0 && page - arr[index - 1] > 1) acc.push("...");
      acc.push(page);
      return acc;
    }, []);
  }, [safeCurrentPage, safeTotalPages]);

  const goToPage = (page: number) => {
    onPageChange(Math.min(Math.max(1, page), safeTotalPages));
  };

  const navButtonClass =
    "h-7 min-w-7 rounded-md border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => goToPage(1)}
        disabled={disabled || safeCurrentPage === 1}
        className={navButtonClass}
        aria-label="Halaman pertama"
      >
        {"<<"}
      </button>
      <button
        type="button"
        onClick={() => goToPage(safeCurrentPage - 1)}
        disabled={disabled || safeCurrentPage === 1}
        className={navButtonClass}
        aria-label="Halaman sebelumnya"
      >
        {"<"}
      </button>

      <div className="flex items-center gap-1">
        {pageItems.map((item, index) =>
          item === "..." ? (
            <span key={`ellipsis-${index}`} className="px-1 text-xs text-slate-400">...</span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => goToPage(item)}
              disabled={disabled}
              className={`h-7 min-w-7 rounded-md border px-2 text-[11px] font-semibold ${
                safeCurrentPage === item
                  ? activeClass
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={() => goToPage(safeCurrentPage + 1)}
        disabled={disabled || safeCurrentPage === safeTotalPages}
        className={navButtonClass}
        aria-label="Halaman berikutnya"
      >
        {">"}
      </button>
      <button
        type="button"
        onClick={() => goToPage(safeTotalPages)}
        disabled={disabled || safeCurrentPage === safeTotalPages}
        className={navButtonClass}
        aria-label="Halaman terakhir"
      >
        {">>"}
      </button>
    </div>
  );
}
