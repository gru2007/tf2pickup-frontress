# Team Frontress portal (mm.team-frontress.org)

## Project Overview

The website of Team Frontress, built on tf2pickup.org and keeping its look: the
admin panel of the Frontress game coordinator (GC) and the place players see
their accounts. Matches are found in the game, not here. The GC
(`services/gc` in team-frontress) owns every record; this site has no database
and no state of its own.

## Commands

- `pnpm dev` — run dev server with hot reload (tsx --watch); needs a GC (`GC_URL`)
- `pnpm build` — TypeScript compilation + tsc-alias + asset copy to dist/
- `pnpm lint` — prettier --check + eslint
- `pnpm format` — prettier --write
- `pnpm test` — unit tests (vitest, files in src/)

## Architecture

- **Fastify 5** with Zod type provider for request validation
- **@kitajs/html** for type-safe JSX → HTML server rendering, **HTMX** for partial updates
- **Tailwind CSS 4** via PostCSS, embedded at render time; **esbuild** bundles `src/html/@client/`
- **The GC** is the only data source: `src/gc/index.ts` (calls) and `src/gc/schemas.ts`
  (Zod schemas of its answers). Admin calls send `GC_ADMIN_KEY` and the acting
  admin's SteamID (`X-Frontress-Actor`); the GC records both.
- **Auth**: Steam OpenID (`src/auth/plugins/steam.ts`); the session is an encrypted
  cookie (`@fastify/secure-session`, `SESSION_SECRET`). Roles come from `ADMINS`
  and `SUPER_USERS` (`src/auth/roles-of.ts`).
- **Names and avatars**: Steam web API with an in-memory cache
  (`src/steam/get-player-summaries.ts`), falling back to the GC's names.
- **Documents**: rules and privacy policy are `src/documents/default/*.md`.

Routes live in `src/routes/` and are auto-loaded with directory-name prefixes,
using the `routes()` wrapper from `src/utils/routes.ts`. Views live next to
their feature (`games/`, `players/`, `admin/`, `hall-of-game/`) under
`views/html/`.

Prefer adapting an existing tf2pickup page or component over adding a new one.

## Conventions

- **One export per file** where practical — the exported name matches the file name
- **Conventional commits**
- **date-fns** helpers for durations; **camelCase** constants
- **Strict TypeScript** (`@tsconfig/strictest`), **ESM only**, **pnpm**

## Testing

After any change, run lint, typecheck and tests.
