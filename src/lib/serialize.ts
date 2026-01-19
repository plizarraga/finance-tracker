/**
 * Serializes Prisma data by converting Decimal objects to numbers and Dates to ISO strings
 * This is needed to pass data to Client Components
 */
type DecimalLike = { toNumber: () => number };

function isDecimalLike(value: unknown): value is DecimalLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as DecimalLike).toNumber === "function"
  );
}

export function serializeForClient<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Date objects
  if (data instanceof Date) {
    return data.toISOString() as T;
  }

  // Check if it's a Decimal-like object (has toNumber method)
  if (isDecimalLike(data)) {
    return data.toNumber() as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeForClient(item)) as T;
  }

  if (typeof data === "object" && data !== null) {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      data as Record<string, unknown>
    )) {
      serialized[key] = serializeForClient(value);
    }
    return serialized as T;
  }

  return data;
}
