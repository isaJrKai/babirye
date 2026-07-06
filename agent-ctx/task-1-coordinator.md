# Task: BABIRYE v10.0.0 UI Page Components

## Completed: All 7 page components + 3 API routes + useApi hook + page.tsx wiring

## Files Created (10 total)

### Hook
- `/src/hooks/use-api.ts` — Custom hook providing `{ data, loading, error, refetch, post, put, del }` with Bearer token auth from `babirye_token` localStorage key.

### API Routes (3)
1. `/src/app/api/intel/route.ts` — GET (feeds with _count.items, items by feedId), POST (create feed admin, create item), PUT (toggle feed active, trigger fetch)
2. `/src/app/api/weapons/route.ts` — GET (weapons by category, martial arts by style), POST (create weapon/martial art admin), PUT (update status/inspection), DELETE (archive weapon admin)
3. `/src/app/api/constitutions/route.ts` — GET (list by subsystem filter), PUT (update content/name/version/active admin only)

### Page Components (7)
1. `/src/pages/login-page.tsx` — Dark-themed centered card, Shield branding, login form with error/lockout display, setup form for first admin, "BABIRYE v10.0.0 Titanium Ultra" badge, stores token in localStorage
2. `/src/pages/settings-page.tsx` — 4 tabs (System Settings with masked secrets/reveal toggle, Users with role dropdown/active toggle/lock status, API Tokens with create/revoke/copy-once flow, Security with password change/session info)
3. `/src/pages/reports-page.tsx` — 7 type cards (Incident through System), reports table with type/classification badges, generate dialog with type+classification, full content viewer with markdown rendering, delete per report
4. `/src/pages/intel-page.tsx` — Feed cards grid with source/type badges, health indicators, last fetch timing, activate/deactivate toggle, drill-down to items table with severity/confidence bars/tags/processed status, filter by source/type/severity
5. `/src/pages/weapons-page.tsx` — 2 tabs (Weapons Database with category filter table: name/category/caliber/range/RoF/capacity/status/serial/inspection, Martial Arts cards with style/difficulty/techniques tags/effectiveness ratings), add weapon dialog
6. `/src/pages/constitutions-page.tsx` — Constitution cards with subsystem badge/version/active/content preview, subsystem filter, full markdown viewer dialog, edit dialog with textarea for admin content updates
7. `/src/pages/gateways-page.tsx` — 6 gateway cards with subsystem color-coding, port/network/deployed services badges, animated active dot, summary bar (total/active/inactive), activate/deactivate buttons, edit dialog for port/host/network/services

### Updated
- `/src/app/page.tsx` — Login gate with token validation, page router mapping PageId → components, authentication state management with loading spinner

## Status
- ✅ ESLint passes with 0 errors
- ✅ Dev server compiling successfully (200 responses)
- ✅ All components use shadcn/ui, Lucide icons, framer-motion animations
- ✅ Responsive design with Tailwind CSS 4
- ✅ Production quality with loading states, error handling, toast notifications