// @vitest-environment node
import { describe, expect, test } from "vitest";

import { buildDecimalLike } from "@/test/data/build-decimal-like";
import { buildSerializableRecord } from "@/test/data/build-serializable-record";

import { serializeForClient } from "@/lib/serialize";

describe("serializeForClient", () => {
  test("When given a Date, then it returns an ISO string", () => {
    const date = new Date("2024-02-03T12:00:00.000Z");
    const expected = date.toISOString();

    const result = serializeForClient(date);

    expect(result).toBe(expected);
  });

  test("When given a Decimal-like value, then it returns a number", () => {
    const decimal = buildDecimalLike({ value: 1450.75 });
    const expected = decimal.toNumber();

    const result = serializeForClient(decimal);

    expect(result).toBe(expected);
  });

  test("When given a nested object, then it serializes dates and decimals", () => {
    const record = buildSerializableRecord();
    const expected = {
      id: record.id,
      postedAt: record.postedAt.toISOString(),
      total: record.total.toNumber(),
      tags: record.tags,
    };

    const result = serializeForClient(record);

    expect(result).toEqual(expected);
  });
});
