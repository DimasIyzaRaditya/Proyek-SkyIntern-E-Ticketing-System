import { useEffect, useState } from "react";

/**
 * Ensures a loading state stays visible for at least `minMs` milliseconds.
 * Prevents flashes where skeleton appears and disappears in < 300ms.
 */
export function useMinDelay(loading: boolean, minMs = 400): boolean {
  const [show, setShow] = useState(loading);

  useEffect(() => {
    if (loading) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), minMs);
      return () => clearTimeout(timer);
    }
  }, [loading, minMs]);

  return show;
}
