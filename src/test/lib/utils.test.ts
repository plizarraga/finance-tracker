import { describe, expect, test } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  test("When given conflicting classes, then it keeps the last class", () => {
    const result = cn("p-2", "p-4", "text-slate-900");

    expect(result).toBe("p-4 text-slate-900");
  });
});
