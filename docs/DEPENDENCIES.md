# Dependency policy & Dependabot notes

## Issues fixed (2026-09-22)

| Issue                                           | Resolution                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| No `package-lock.json`                          | Must be generated via `npm install` (committed after first successful install) |
| `next@15.0.3` peer conflict with `react@19.0.0` | Bumped to `next@15.2.4` + matching `eslint-config-next` (React 19 supported)   |
| Stale AI SDK (`@ai-sdk/*@0.0.x`, `ai@4.0.20`)   | Upgraded to `@ai-sdk/openai@^1.3`, `@ai-sdk/anthropic@^1.2`, `ai@^4.3`         |
| ORM migration                                   | Replaced Drizzle with Prisma 6 and a single `prisma/schema.prisma` data model  |
| Stale OTEL exporters `0.53`                     | Bumped to `0.57.2`                                                             |
| Missing Redis declared dependency               | Already added (`redis@^4.7`)                                                   |
| Potential vulnerable transitive `esbuild`       | Forced via `overrides` to `>=0.25.1`                                           |
| No automated dependency updates                 | Added `.github/dependabot.yml`                                                 |

## Install

```bash
npm ci          # preferred in CI (requires committed lockfile)
# or
npm install     # generates/updates package-lock.json
```

If peer warnings appear for residual Radix / ecosystem packages:

```bash
npm install --legacy-peer-deps
```

## Security audit

```bash
npm audit
npm audit fix   # only for non-breaking fixes
```

Do **not** run `npm audit fix --force` without reviewing the diff.

## Version pinning policy

- Framework packages (`next`, `react`, `react-dom`): pin patch (`15.2.4`) or tight caret on minor.
- Domain/AI libraries: caret ranges allowing minor/patch.
- Major upgrades of Next / React / Prisma require explicit PR + test run (`npm test && npm run eval && npm run build`).

## Known remaining work after first `npm install`

1. Commit the generated `package-lock.json`.
2. Run `npm audit` and address any high/critical findings.
3. Confirm `npm run typecheck` and `npm test` pass with the new AI SDK / Prisma versions (API surface is stable for the used subset).
