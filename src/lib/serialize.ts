/**
 * Serializes Prisma data by converting Decimal objects to numbers and Dates to ISO strings
 * This is needed to pass data to Client Components
 */
export function serializeForClient<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Date objects
  if (data instanceof Date) {
    return data.toISOString() as T;
  }

  // Check if it's a Decimal-like object (has toNumber method)
  if (
    typeof data === "object" &&
    data !== null &&
    "toNumber" in data &&
    typeof data.toNumber === "function"
  ) {
    return (data as any).toNumber() as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeForClient(item)) as T;
  }

  if (typeof data === "object" && data !== null) {
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeForClient(value);
    }
    return serialized;
  }

  return data;
}
