"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type CompactDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
};

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad = (n: number) => String(n).padStart(2, "0");

const toDateValue = (year: number, month: number, date: number) => `${year}-${pad(month + 1)}-${pad(date)}`;

const parseDateValue = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
};

export default function CompactDatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "YYYY-MM-DD",
}: CompactDatePickerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const yearListRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const [popupPos, setPopupPos] = useState<{
    top: number;
    left: number;
    width: number;
    placement: "top" | "bottom";
  } | null>(null);

  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const minDate = useMemo(() => (min ? parseDateValue(min) : null), [min]);
  const maxDate = useMemo(() => (max ? parseDateValue(max) : null), [max]);

  const today = useMemo(() => new Date(), []);

  const [cursorYear, setCursorYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear());
  const [cursorMonth, setCursorMonth] = useState(selectedDate?.getMonth() ?? today.getMonth());

  const yearOptions = useMemo(() => {
    const fallbackMin = today.getFullYear() - 100;
    const fallbackMax = today.getFullYear() + 20;

    const minYear = minDate?.getFullYear() ?? fallbackMin;
    const maxYear = maxDate?.getFullYear() ?? fallbackMax;

    const start = Math.min(minYear, cursorYear, selectedDate?.getFullYear() ?? cursorYear);
    const end = Math.max(maxYear, cursorYear, selectedDate?.getFullYear() ?? cursorYear);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [cursorYear, maxDate, minDate, selectedDate, today]);

  const updatePopupPosition = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;

    const margin = 8;
    const gap = 8;
    const estimatedHeight = 336;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const width = Math.min(rect.width, viewportWidth - margin * 2);
    const left = Math.max(margin, Math.min(rect.left, viewportWidth - width - margin));

    const spaceBelow = viewportHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const placeTop = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    let top = placeTop ? rect.top - estimatedHeight - gap : rect.bottom + gap;
    top = Math.max(margin, Math.min(top, viewportHeight - estimatedHeight - margin));

    setPopupPos({
      top,
      left,
      width,
      placement: placeTop ? "top" : "bottom",
    });
  };

  const closePopup = () => {
    setVisible(false);
    setYearMenuOpen(false);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 180);
  };

  const openPopup = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
    setVisible(true);
  };

  useEffect(() => {
    setMounted(true);
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const base = selectedDate ?? today;
    setCursorYear(base.getFullYear());
    setCursorMonth(base.getMonth());
    updatePopupPosition();
  }, [open, selectedDate, today]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popupRef.current?.contains(target)) {
        closePopup();
      } else if (yearMenuOpen && !yearListRef.current?.contains(target)) {
        setYearMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopup();
    };

    const handleViewportChange = () => {
      updatePopupPosition();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, yearMenuOpen]);

  useEffect(() => {
    if (!yearMenuOpen) return;
    const currentYearBtn = yearListRef.current?.querySelector<HTMLButtonElement>(`button[data-year='${cursorYear}']`);
    currentYearBtn?.scrollIntoView({ block: "nearest" });
  }, [cursorYear, yearMenuOpen]);

  const calendarCells = useMemo(() => {
    const firstOfMonth = new Date(cursorYear, cursorMonth, 1);
    const firstWeekday = firstOfMonth.getDay();
    const daysInCurrentMonth = new Date(cursorYear, cursorMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(cursorYear, cursorMonth, 0).getDate();

    return Array.from({ length: 42 }, (_, index) => {
      const inPrevMonth = index < firstWeekday;
      const inCurrentMonth = index >= firstWeekday && index < firstWeekday + daysInCurrentMonth;

      let year = cursorYear;
      let month = cursorMonth;
      let date = 1;

      if (inPrevMonth) {
        date = daysInPrevMonth - (firstWeekday - index - 1);
        month = cursorMonth - 1;
        if (month < 0) {
          month = 11;
          year -= 1;
        }
      } else if (inCurrentMonth) {
        date = index - firstWeekday + 1;
      } else {
        date = index - (firstWeekday + daysInCurrentMonth) + 1;
        month = cursorMonth + 1;
        if (month > 11) {
          month = 0;
          year += 1;
        }
      }

      const dateValue = toDateValue(year, month, date);
      const outOfRange = (minDate && dateValue < toDateValue(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) ||
        (maxDate && dateValue > toDateValue(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()));

      return {
        date,
        dateValue,
        inCurrentMonth,
        disabled: !inCurrentMonth || Boolean(outOfRange),
      };
    });
  }, [cursorMonth, cursorYear, maxDate, minDate]);

  const goPrevMonth = () => {
    setCursorMonth((prev) => {
      if (prev === 0) {
        setCursorYear((year) => year - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const goNextMonth = () => {
    setCursorMonth((prev) => {
      if (prev === 11) {
        setCursorYear((year) => year + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => (open ? closePopup() : openPopup())}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        <span className={value ? "text-slate-800" : "text-slate-400"}>{value || placeholder}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
      </button>

      {mounted && open && popupPos
        ? createPortal(
            <div
              ref={popupRef}
              style={{
                position: "fixed",
                top: popupPos.top,
                left: popupPos.left,
                width: popupPos.width,
                zIndex: 9999,
              }}
              className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl transition-all duration-200 ${
                visible
                  ? "translate-y-0 opacity-100"
                  : popupPos.placement === "top"
                    ? "translate-y-2 opacity-0"
                    : "-translate-y-2 opacity-0"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  className="rounded-md p-1 text-slate-600 hover:bg-slate-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">{MONTH_NAMES[cursorMonth]}</p>
                  <div className="relative" ref={yearListRef}>
                    <button
                      type="button"
                      onClick={() => setYearMenuOpen((prev) => !prev)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-800 outline-none hover:bg-slate-50 focus:border-blue-400"
                    >
                      {cursorYear}
                      <ChevronDown className={`h-3.5 w-3.5 transition ${yearMenuOpen ? "rotate-180" : ""}`} />
                    </button>
                    {yearMenuOpen && (
                      <div className="absolute right-0 top-full z-20 mt-1 w-24 max-h-44 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                        {yearOptions.map((year) => (
                          <button
                            key={year}
                            type="button"
                            data-year={year}
                            onClick={() => {
                              setCursorYear(year);
                              setYearMenuOpen(false);
                            }}
                            className={`w-full px-2 py-1.5 text-left text-sm ${
                              year === cursorYear
                                ? "bg-blue-900 font-semibold text-white"
                                : "text-slate-700 hover:bg-blue-50"
                            }`}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={goNextMonth}
                  className="rounded-md p-1 text-slate-600 hover:bg-slate-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 px-2 pt-2 text-center text-xs font-semibold text-slate-500">
                {WEEK_DAYS.map((day) => (
                  <div key={day} className="py-1">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 p-2">
                {calendarCells.map((cell) => {
                  const isSelected = value === cell.dateValue;
                  return (
                    <button
                      key={cell.dateValue}
                      type="button"
                      disabled={cell.disabled}
                      onClick={() => {
                        onChange(cell.dateValue);
                        closePopup();
                      }}
                      className={`h-8 rounded-md text-sm transition ${
                        isSelected
                          ? "bg-blue-900 font-semibold text-white"
                          : cell.disabled
                            ? "cursor-not-allowed text-slate-300"
                            : "text-slate-700 hover:bg-blue-50"
                      }`}
                    >
                      {cell.date}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
