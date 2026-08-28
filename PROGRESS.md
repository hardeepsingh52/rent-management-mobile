# Progress Log

This file is the shared record of what's happening on this project, since it's
tracked in git and syncs across every machine (Windows desktop + MacBook) and
every AI coding agent (Claude Code, Codex CLI, etc.) we work with. Any agent
reads this at the start of a session to catch up on decisions made elsewhere —
see the handoff protocol below. Add a short entry whenever something
meaningful changes, and note which tool/machine made it.

Format: newest entries at the top.

## Shared agent handoff protocol

Same protocol as the sibling `Rent Management Front-End` (web) repo's
`PROGRESS.md` — read that file too if you haven't, since this mobile app talks
to the same backend and some context (backend endpoints, compliance rules)
lives there rather than being duplicated here.

- At the start of every session: run `git pull`, then read this file before making changes.
- Before ending meaningful work: add a dated entry describing what changed, what was verified,
  the current decision/state, and the exact next step.
- Keep entries factual and concise; record blockers or questions explicitly rather than guessing.
- Commit and push the entry with its related work so the other agent and machine can see it.
- This file is the shared source of truth; conversation memory and local uncommitted changes are
  not assumed to be available to the other agent.
- **Canadian & Provincial Tenancy Law Compliance (Federal, Ontario, Manitoba)**: same standing
  requirement as the web repo — see this project's `AGENTS.md` for the full text.

## 2026-08-28 — Claude (Windows) built out the mobile app's first real feature set

- New project this session — `npx create-expo-app` scaffold (Expo SDK 57, Expo Router, TypeScript),
  sibling repo to `Rent Management Front-End` and `Rent Management Back-End`, same owner/backend.
  Guided step-by-step, user typed every file by hand (same guided-coding-mode rule as the web repo).
- **Everything below talks to the real backend** (`EXPO_PUBLIC_BACKEND_API_URL`, currently the same
  Azure instance the web app's production build uses) — no mocked data at any point.
- **Auth**: login screen (email/password → `POST /api/auth/login`), session held in a
  `SessionProvider` context backed by `expo-secure-store` (falls back to `localStorage` on web,
  branched by `Platform.OS` since SecureStore has no web implementation at all — confirmed by
  reading the installed package, not assumed). Forgot-password request screen
  (`POST /api/auth/forgot-password`) — note the emailed reset link itself currently points at the
  **web app's** URL, not a mobile deep link, so completing a reset still happens in a browser; making
  the email link open this app too would need the backend's email template changed, not attempted
  this session. **Biometric login** (Face ID/Touch ID via `expo-local-authentication`): after a
  successful password login, the session is cached securely on-device; biometric unlock restores
  that cached session locally rather than re-hitting the backend. Native-only by design (gated on
  `hasHardwareAsync`/`isEnrolledAsync`; silently unavailable on web, correctly so).
- **Dashboard, properties, units** — all real: dashboard KPI cards + live properties list;
  properties list with client-side search and stats; property detail with its units; add-property
  and add-unit forms (property-types/unit-types fetched from the backend for the type pickers, not
  hardcoded).
- **Real navigation bug found and fixed**: property detail and the add-property/add-unit screens
  were originally nested inside the Properties tab's own stack. Tapping into a property from the
  **Dashboard** tab (a different tab) landed on top of whatever was already in the Properties tab's
  stack history — in testing this meant "back" went to a leftover "Add property" screen instead of
  the Dashboard, and the same would happen for a real user via a different path (browse Properties →
  open A → Add property → cancel → switch to Dashboard → open B → back goes to Add property, not
  Dashboard). Fixed by moving `properties/[id]` and `properties/new` (and `properties/[id]/units/new`)
  to the **root** navigation stack instead of nesting them under `(tabs)/properties` — shared detail
  screens reachable from multiple tabs belong at the root so `back` always returns to whichever
  screen actually pushed them.
- **Navigation bar unified across native and web**: confirmed `expo-router/ui`'s `Tabs`/`TabList`/
  `TabTrigger`/`TabSlot` have no platform-specific files at all (checked directly in
  `node_modules`) — they're genuinely cross-platform, built on React Navigation's core rather than
  any native OS chrome. Replaced the original two-file split (`app-tabs.tsx` using `NativeTabs` for
  native, `app-tabs.web.tsx` using `expo-router/ui` for web) with a single `app-tabs.tsx` using the
  cross-platform primitives for both — a deliberate trade-off (loses the free native tab-bar polish
  `NativeTabs` gives, in exchange for the custom floating "island" bar with a raised center
  add-property button looking identical on every platform). User explicitly chose this over keeping
  `NativeTabs` on native when asked.
- **Design pass** on login and dashboard: mocked up several directions with the `visualize` tool
  first (branded blue gradient, navy/cyan bento grid, quiet editorial, teal/pastel — plus two rounds
  adapting colors from reference images the user provided) before writing any real code, landing on
  a deep teal-green (`#16302b`) + orange (`#f4793a`) palette with mint/peach pastel stat cards and
  green status pills. Login got a matching gradient header, icon-accented input fields, and a
  password show/hide toggle.
- **Known inconsistency, not yet fixed**: the properties list/detail screens are still on the old
  blue (`#1565c0`) accent from before this design pass (their own "+" button, badges, etc.) — the
  redesign only covered the dashboard, login, and the shared nav bar. Flagged to the user, not done
  since it wasn't asked for yet.
- **Device testing status**: still blocked on the actual phone-in-hand testing front — this session
  ran entirely on an office Windows PC. LAN mode is blocked by CrowdStrike (office endpoint security
  blocking inbound connections); a Cloudflare tunnel got the connection itself working, but Expo Go's
  App Store build is stuck on SDK 54 while this project is on SDK 57 (confirmed via Expo's own
  `api.expo.dev/v2/versions/latest` — the mismatch is real, not something we misconfigured). Decision
  made to wait for Apple's App Store review to catch Expo Go up, rather than downgrade the project or
  build a custom dev client, since this was all happening on a locked-down office machine. **The
  user has a MacBook** (per the web repo's own `AGENTS.md`) — `npx expo run:ios` there would sidestep
  the Expo Go SDK mismatch entirely (builds this project's actual code, not the shared Expo Go
  client) and needs only a free Apple ID, not the $99/year Developer Program, for on-device testing.
  Not yet done this session.
- Verified with `npx tsc --noEmit` after every step (always clean by the end, though it took several
  rounds — Expo Router's typed-routes generation proved genuinely flaky mid-session: a zombie
  `expo start` process left running since a much earlier port conflict was intermittently overwriting
  the generated route types with stale state, which cost real time before being root-caused). All
  features spot-checked in the web preview (`npx expo start --web`) — real backend calls, real data,
  zero console errors on every screen — since native device testing wasn't available this session.
- **Next step**: on the MacBook, `git pull` then `npx expo run:ios` to get this onto a real device
  for the first time and confirm biometric login, the floating nav bar, and general feel actually
  work outside the web preview. Then: bring properties list/detail up to the new color palette, and
  decide on tenants (still a stub) as the next real feature.
