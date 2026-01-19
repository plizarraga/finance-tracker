import { buildDecimalLike, type DecimalLike } from "./build-decimal-like";

export type SerializableRecord = {
  id: string;
  postedAt: Date;
  total: DecimalLike;
  tags: string[];
};

export function buildSerializableRecord(
  overrides: Partial<SerializableRecord> = {}
): SerializableRecord {
  const base: SerializableRecord = {
    id: "expense-2024-02",
    postedAt: new Date("2024-02-03T12:00:00.000Z"),
    total: buildDecimalLike(),
    tags: ["Payroll", "Operations"],
  };
  return { ...base, ...overrides };
}
