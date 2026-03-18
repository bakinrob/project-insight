

# Fix Build Errors

Two issues to fix:

## 1. `dealer-discovery.ts` - Type predicate mismatch (lines 124-148)

The `.map()` produces objects where `anchorText` is always `string`, but `DiscoveryPageCandidate` has `anchorText?: string | undefined`. The type predicate `candidate is DiscoveryPageCandidate` fails because TypeScript sees the mapped type's `anchorText: string` as incompatible.

**Fix**: Cast `anchorText` to `string | undefined` in the map, or simply add an intermediate cast. Simplest fix: change the filter to just `.filter(Boolean) as DiscoveryPageCandidate[]`.

## 2. `Index.tsx` - BrandConfig not assignable to Record (lines 123, 150)

`brands[brandKey]` returns `BrandConfig` which is an interface (no index signature), but `structurePage` and `generatePage` expect `brand: Record<string, unknown>`.

**Fix**: Cast `brand` to `Record<string, unknown>` at the call sites, or spread it: `brand: { ...brand }` or `brand: brand as Record<string, unknown>`.

Both are simple type-level fixes, no logic changes needed.

