export type DecimalLike = {
  toNumber: () => number;
};

type DecimalLikeInput = {
  value: number;
};

export function buildDecimalLike(
  overrides: Partial<DecimalLikeInput> = {}
): DecimalLike {
  const base: DecimalLikeInput = { value: 1450.75 };
  const value = overrides.value ?? base.value;
  return { toNumber: () => value };
}
