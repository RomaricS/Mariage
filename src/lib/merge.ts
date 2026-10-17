function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Merge saved content over the defaults: objects merge key by key, arrays and values replace. */
export function mergeContent<T>(base: T, saved: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(saved)) return (saved === undefined ? base : saved) as T;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(saved)) {
    out[k] = k in base ? mergeContent((base as Record<string, unknown>)[k], v) : v;
  }
  return out as T;
}
