import { useEffect, useState } from 'react';

/** `value`, once it has stopped changing for `ms` (so parsing doesn't run on every keystroke). */
export function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}
