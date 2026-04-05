import { useEffect, useState } from "react";

/**
 * Ensures a loading state stays visible for at least `minMs` milliseconds.
 * Prevents flashes where skeleton appears and disappears in < 300ms.
 */
export function useMinDelay(loading: boolean, minMs = 400): boolean {
  const [readyToHide, setReadyToHide] = useState(!loading);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setReadyToHide(false), 0);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setReadyToHide(true), minMs);
      return () => clearTimeout(timer);
    }
  }, [loading, minMs]);

  return loading || !readyToHide;
}
