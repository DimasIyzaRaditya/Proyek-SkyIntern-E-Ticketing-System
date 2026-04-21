"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock3 } from "lucide-react";

type CompactTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

type Meridiem = "AM" | "PM";

const pad = (n: number) => String(n).padStart(2, "0");

const parseTime = (value: string): { hour12: number; minute: number; period: Meridiem } => {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return { hour12: 12, minute: 0, period: "AM" as const };
  }

  const [hourRaw, minuteRaw] = value.split(":").map(Number);
  const period: Meridiem = hourRaw >= 12 ? "PM" : "AM";
  const hour12 = hourRaw % 12 === 0 ? 12 : hourRaw % 12;

  return {
    hour12,
    minute: Number.isNaN(minuteRaw) ? 0 : minuteRaw,
    period,
  };
};

const to24Hour = (hour12: number, period: Meridiem) => {
  if (period === "AM") return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
};

const formatDisplay = (value: string) => {
  if (!/^\d{2}:\d{2}$/.test(value)) return "";
  const { hour12, minute, period } = parseTime(value);
  return `${pad(hour12)}:${pad(minute)} ${period}`;
};

export default function CompactTimePicker({
  value,
  onChange,
  placeholder = "HH:mm",
}: CompactTimePickerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const hourRef = useRef<HTMLDivElement | null>(null);
  const minuteRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [popupPos, setPopupPos] = useState<{
    top: number;
    left: number;
    width: number;
    placement: "top" | "bottom";
  } | null>(null);

  const parsed = useMemo(() => parseTime(value), [value]);

  const [hour12, setHour12] = useState(parsed.hour12);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState<Meridiem>(parsed.period);

  const updatePopupPosition = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;

    const margin = 8;
    const gap = 8;
    const estimatedHeight = 304;
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

    setHour12(parsed.hour12);
    setMinute(parsed.minute);
    setPeriod(parsed.period);
    updatePopupPosition();
  }, [open, parsed.hour12, parsed.minute, parsed.period]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popupRef.current?.contains(target)) {
        closePopup();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePopup();
      }
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
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const activeHour = hourRef.current?.querySelector<HTMLButtonElement>(`button[data-hour='${hour12}']`);
    const activeMinute = minuteRef.current?.querySelector<HTMLButtonElement>(`button[data-minute='${minute}']`);

    activeHour?.scrollIntoView({ block: "nearest" });
    activeMinute?.scrollIntoView({ block: "nearest" });
  }, [hour12, minute, open]);

  const emit = (nextHour12: number, nextMinute: number, nextPeriod: Meridiem) => {
    const hour24 = to24Hour(nextHour12, nextPeriod);
    onChange(`${pad(hour24)}:${pad(nextMinute)}`);
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => (open ? closePopup() : openPopup())}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        <span className={value ? "text-slate-800" : "text-slate-400"}>{formatDisplay(value) || placeholder}</span>
        <Clock3 className="h-4 w-4 shrink-0 text-slate-500" />
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
              className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl transition-all duration-200 ${
                visible
                  ? "translate-y-0 opacity-100"
                  : popupPos.placement === "top"
                    ? "translate-y-2 opacity-0"
                    : "-translate-y-2 opacity-0"
              }`}
            >
              <div className="grid grid-cols-3 gap-2 p-2">
                <div ref={hourRef} className="h-48 overflow-y-auto rounded-lg border border-slate-100">
                  {HOURS_12.map((h) => {
                    const active = h === hour12;
                    return (
                      <button
                        key={h}
                        type="button"
                        data-hour={h}
                        onClick={() => {
                          setHour12(h);
                          emit(h, minute, period);
                        }}
                        className={`w-full px-2 py-2 text-sm ${
                          active ? "bg-blue-900 font-semibold text-white" : "text-slate-700 hover:bg-blue-50"
                        }`}
                      >
                        {pad(h)}
                      </button>
                    );
                  })}
                </div>

                <div ref={minuteRef} className="h-48 overflow-y-auto rounded-lg border border-slate-100">
                  {MINUTES.map((m) => {
                    const active = m === minute;
                    return (
                      <button
                        key={m}
                        type="button"
                        data-minute={m}
                        onClick={() => {
                          setMinute(m);
                          emit(hour12, m, period);
                        }}
                        className={`w-full px-2 py-2 text-sm ${
                          active ? "bg-blue-900 font-semibold text-white" : "text-slate-700 hover:bg-blue-50"
                        }`}
                      >
                        {pad(m)}
                      </button>
                    );
                  })}
                </div>

                <div className="h-48 overflow-y-auto rounded-lg border border-slate-100">
                  {(["AM", "PM"] as const).map((p) => {
                    const active = p === period;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setPeriod(p);
                          emit(hour12, minute, p);
                        }}
                        className={`w-full px-2 py-2 text-sm ${
                          active ? "bg-blue-900 font-semibold text-white" : "text-slate-700 hover:bg-blue-50"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
