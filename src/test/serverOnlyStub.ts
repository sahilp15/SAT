// `server-only` is a Next.js build-time guard that has no runtime behavior.
// Vitest doesn't resolve it, so modules carrying the guard are aliased to this
// no-op. The guard still does its job in the real build.
export {};
