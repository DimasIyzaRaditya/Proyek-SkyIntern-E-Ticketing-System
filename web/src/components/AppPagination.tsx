"use client";

import { useMemo } from "react";

type AppPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  pageSizeId: string;
};

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function AppPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  pageSizeId,
}: AppPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const firstItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const lastItem = Math.min(safeCurrentPage * pageSize, totalItems);

  const pageItems = useMemo(() => {
    const pages = Array.from({ length: safeTotalPages }, (_, index) => index + 1)
      .filter((page) => page === 1 || page === safeTotalPages || Math.abs(page - safeCurrentPage) <= 2);

    return pages.reduce<(number | "...")[]>((acc, page, index, arr) => {
      if (index > 0 && page - arr[index - 1] > 1) acc.push("...");
      acc.push(page);
      return acc;
    }, []);
  }, [safeCurrentPage, safeTotalPages]);

  const goToPage = (page: number) => {
    onPageChange(Math.min(Math.max(1, page), safeTotalPages));
  };

  const buttonClass =
    "h-9 min-w-9 rounded-lg border border-blue-100 bg-blue-50 px-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="mt-4 space-y-3 text-sm text-slate-600">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>
          Menampilkan {firstItem} - {lastItem} dari {totalItems} data.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-100 pt-3">
        <div className="inline-flex items-center gap-2">
          <label htmlFor={pageSizeId} className="font-medium text-slate-700">Tampilkan</label>
          <select
            id={pageSizeId}
            value={pageSize}
            onChange={(event) => {
              onPageSizeChange(Number(event.target.value));
              onPageChange(1);
            }}
            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size} data</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => goToPage(1)}
            disabled={safeCurrentPage === 1}
            className={buttonClass}
            aria-label="Halaman pertama"
          >
            {"<<"}
          </button>
          <button
            type="button"
            onClick={() => goToPage(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            className={buttonClass}
            aria-label="Halaman sebelumnya"
          >
            {"<"}
          </button>

          {pageItems.map((item, index) =>
            item === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 text-slate-400">...</span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => goToPage(item)}
                className={`h-9 min-w-9 rounded-lg border px-3 text-sm font-semibold ${
                  safeCurrentPage === item
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => goToPage(safeCurrentPage + 1)}
            disabled={safeCurrentPage === safeTotalPages}
            className={buttonClass}
            aria-label="Halaman berikutnya"
          >
            {">"}
          </button>
          <button
            type="button"
            onClick={() => goToPage(safeTotalPages)}
            disabled={safeCurrentPage === safeTotalPages}
            className={buttonClass}
            aria-label="Halaman terakhir"
          >
            {">>"}
          </button>
        </div>
      </div>
    </div>
  );
}
