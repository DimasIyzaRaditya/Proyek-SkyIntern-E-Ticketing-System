"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

type SelectOption = {
  value: number;
  label: string;
};

type ResponsiveSelectProps = {
  value: number;
  onChange: (value: number) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
};

export default function ResponsiveSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih opsi",
  disabled = false,
}: ResponsiveSelectProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = useMemo(
    () => options.find((item) => item.value === value)?.label ?? "",
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((item) => item.label.toLowerCase().includes(normalized));
  }, [keyword, options]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full min-w-0 max-w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-left text-slate-900 transition-all duration-200 ease-out hover:border-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        className={`absolute z-50 mt-1 w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-blue-100 bg-white shadow-lg transition-all duration-200 ease-out ${
          open ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0"
        }`}
      >
        {open && (
          <div className="border-b border-blue-100 p-2">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Cari..."
              className="w-full rounded-lg border border-blue-100 bg-blue-50 px-2 py-1.5 text-sm outline-none ring-blue-200 focus:ring"
            />
          </div>
        )}

        <ul className={`overflow-y-auto py-1 ${open ? "max-h-64" : "max-h-0"}`}>
          {open
            ? filteredOptions.length === 0
              ? <li className="px-3 py-2 text-sm text-slate-500">Data tidak ditemukan.</li>
              : filteredOptions.map((item) => (
                  <li key={item.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(item.value);
                        setKeyword("");
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-800 hover:bg-blue-50"
                    >
                      <span className="truncate">{item.label}</span>
                      {item.value === value && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
                    </button>
                  </li>
                ))
            : null}
        </ul>
      </div>
    </div>
  );
}
