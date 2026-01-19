import { renderHook } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useDebounce } from "@/hooks/use-debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
      false;
  });

  test("When rendering with an initial value, then it returns the initial value", () => {
    const value = "Payroll";
    const { result, unmount } = renderHook(() => useDebounce(value, 200));

    const debouncedValue = result.current;

    unmount();

    expect(debouncedValue).toBe(value);
  });

  test("When the value changes and the delay elapses, then it returns the new value", () => {
    const initialValue = "Payroll";
    const nextValue = "Office";
    const delay = 200;
    const { result, rerender, unmount } = renderHook(
      ({ value }) => useDebounce(value, delay),
      { initialProps: { value: initialValue } }
    );

    rerender({ value: nextValue });

    act(() => {
      vi.advanceTimersByTime(delay);
    });

    const debouncedValue = result.current;

    unmount();

    expect(debouncedValue).toBe(nextValue);
  });
});
