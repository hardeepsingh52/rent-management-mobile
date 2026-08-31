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

## 2026-08-31 — Claude (Windows) added session-expiry handling and started centralizing colors

- **Real bug found and fixed: expired login token never signed the user out.** There
  was no handling anywhere for an expired backend token — API calls just failed with
  a generic "Something went wrong" error forever, since nothing ever cleared the
  cached session or navigated back to login. Fixed in two files: `api-client.ts`'s
  `backendFetch` now detects a `401` response and fires a registered
  `onUnauthorized` handler (`setUnauthorizedHandler`); `session-context.tsx`
  registers `signOut` as that handler on mount, and `signOut` now also clears the
  cached biometric session (`Platform.OS !== "web"` guarded) so Face ID can't
  silently hand back the same dead token. No screen code changed — `_layout.tsx`'s
  existing `Stack.Protected guard={!user}` already reacts to `signOut()` clearing
  `user`, so the redirect to `/login` falls out of the existing declarative routing
  for free.
- **Known gap, not yet built**: this only catches expiry reactively, when an actual
  API call fails. Screens that never call the backend at all (Profile, which just
  renders cached `user.fullName`/`email`) can still show stale session data
  indefinitely if the app is reopened after the token's already expired. A
  `src/lib/jwt.ts` helper (`isTokenExpired`, decoding the JWT's own `exp` claim
  locally — no `atob`/`Buffer` polyfill exists in this RN/Expo version, so it needs a
  hand-rolled base64url decoder, not a new dependency) plus checks on cold launch and
  on `AppState` returning to `"active"` were designed but not implemented — see next
  point.
- **Backend is moving to access token (15 min) + refresh token (2-3 months,
  rotating) — not done yet.** Once it ships, the mobile work above gets *extended*
  (`SessionUser` gains `refreshToken`, `backendFetch` attempts a refresh before
  giving up and signing out, concurrent 401s need to share one in-flight refresh call
  since rotation invalidates the old refresh token on use) rather than replaced. The
  proactive `jwt.ts` check above is still worth doing regardless of refresh tokens,
  since Profile still never makes an API call either way. Blocked on the actual
  endpoint contract (path, request/response field names) — don't guess it.
- **Started centralizing the app's color palette** into `src/constants/colors.ts`
  (new file — deliberately not reusing the pre-existing `constants/theme.ts`, which
  is unused `create-expo-app` scaffold with its own unrelated `Colors.light/dark`
  shape still referenced by a few unused template components). Every hex literal
  across the app was grepped to build the list. Converted so far: `app-tabs.tsx`
  (also fixed a real inconsistency this surfaced — the floating tab bar's raised "+"
  button was still on `#f4793a`, a leftover orange from the very first design pass,
  while everywhere else had already standardized on `#d9601f`; now uses
  `Colors.accentOrange` like the rest of the app) and `login.tsx`. This is being done
  as its own reason: same colors need porting to the sibling web app's
  `globals.css` (Tailwind v4 theme) eventually, and web is currently still on the old
  pre-rebrand blue/green palette — not started on the web side yet, mobile first.
- Verified with `npx tsc --noEmit` (clean) after each step; app-tabs/login changes
  spot-checked in the web preview (onboarding screen renders correctly, zero console
  errors — couldn't verify past login without test credentials, not blocking).
- **Next step**: keep converting remaining screens to `Colors.*` — `onboarding.tsx`,
  dashboard `index.tsx` (largest), `properties.tsx`, `properties/new.tsx`,
  `properties/[id]/index.tsx`, `properties/[id]/units/new.tsx`. After that, either
  build the `jwt.ts` proactive-expiry check, or wait for the backend refresh-token
  endpoint and do both auth pieces together — user's call.

## 2026-08-29 — Claude (Mac) brought the Properties list screen onto the new design language

- Mocked up the change with the `visualize` tool first (single-accent stat tiles, photo-style
  property cards with a quiet type badge) and got it approved before writing code, same workflow as
  every design pass this project has used.
- **Properties tab list** (`(tabs)/properties.tsx`): the 3-stat row went from pastel teal/orange/blue
  cards with trend icons and non-functional "View all" links to plain white tiles with a single
  orange icon, matching the dashboard's stat tiles. Property cards now use the real
  `property-placeholder.jpg` photo (same one property detail already uses) instead of a colored
  icon-tile, with the property type shown as a quiet dark badge overlaid on the photo. **Removed two
  fake/dead UI elements** while there: the hardcoded "Active" badge (no property-status field exists
  in the backend) and the `⋮` menu icon, which had no `onPress` handler at all — it did nothing.
  Units/Tenants stat pills went from two different tint colors to one consistent style. "Add new
  property" button changed from dark green to orange to match the primary-action convention every
  other screen now uses.
- Caught and reverted an unrelated accidental edit in `properties/[id]/index.tsx` before committing
  (`content` padding had been changed from 18 to 60, which misaligned the body with the header and
  cut off the unit list — confirmed with the user it wasn't intentional).
- **Property detail screen** (`properties/[id]/index.tsx`) picked up two more fixes while working in
  the same area: the screen wasn't wrapped in `SafeAreaView` at all (unlike every other top-level
  screen), so its custom header relied on a guessed fixed `paddingTop` instead of the actual
  device/browser notch inset — now wrapped in `SafeAreaView edges={["top"]}` like the rest of the
  app. Also added a dashed-border "+ Add Unit" card at the end of the horizontal unit-card list
  (always rendered now, even with zero units) — previously the only way in was the small unlabeled
  "+" icon in the header, easy to miss.
- Mid-session note for whoever picks this up: while iterating on this file, a couple of hand-typed
  edits landed a stray `</SafeAreaView>` closing tag in the wrong place (inside an `onPress` handler),
  which broke the build with a cascade of TS1005/TS17008 syntax errors. Resolved by replacing the
  whole file rather than patching around it. Nothing left over from that — just noting it in case the
  git history looks choppy around this file.
- Verified in the web preview: real backend data, zero new console errors, `npx tsc --noEmit` clean.
- **Next step**: same as before — Tenants tab, Profile tab, and Forgot Password are the only screens
  left on old/default styling.

## 2026-08-29 — Claude (Mac) rebrand to DomusPRO + full design pass on the remaining screens

- **Rebrand**: app renamed `rent-management-mobile` → **DomusPRO** in `app.json` (`expo.name`), new
  icon/adaptive-icon/splash all point at a new logo mark (`assets/images/app-logo-symbol-2.png`),
  splash background changed to the brand red `#FF3131`, iOS `bundleIdentifier` set
  (`com.anonymous.rent-management-mobile`), Android biometric permissions
  (`USE_BIOMETRIC`/`USE_FINGERPRINT`) added explicitly, and `npm run android`/`npm run ios` switched
  from `expo start --android/--ios` (Expo Go) to `expo run:android`/`expo run:ios` (builds this
  project's own dev client) — done directly by the user, not this session, but included in this
  commit since it landed in the same working tree.
- **New onboarding screen** (`(auth)/onboarding.tsx`): full-bleed photo with a rounded card
  overlapping the bottom (headline, subtitle, red `#ff3131` "Get Started" pill button sampled
  directly from the DomousPRO logo's red). Registered as the first screen in the unauthenticated
  `Stack.Protected` group in `_layout.tsx` so it's what a logged-out user sees first; "Get Started"
  `router.replace`s to `/login` (replace, not push, so back-navigation can't return to onboarding).
- **Login redesigned**: dropped the old dark-green gradient header entirely for a flat white
  layout — centered `DomousPRO` logotype, "Log In" heading, icon-prefixed pill inputs, "Forgot
  password?" inline with the Password label instead of below the field, full-pill orange submit
  button. No landlord/tenant role selector (app is landlord-only).
- **Dashboard rebuilt** to match a reference design: avatar-first header (dropped the old hamburger
  menu), 2×2 "Property Summary" stat grid (Properties / Occupied / Rent Collected / Maint. Request),
  an "Occupancy Rates" bar chart, and a "Recent Activity" section — kept the existing "My
  Properties" list and "Quick Actions" grid below since they're real wired-up features the reference
  screenshot just didn't happen to show. Where the reference implied data that doesn't exist in the
  backend yet, went with honest placeholders over fabricated ones, flagged in code: **Rent
  Collected shows `—`** (no rent-tracking backend at all), **Maint. Request shows `0`** (no
  maintenance-request feature exists), and **Recent Activity shows "No recent activity yet"**
  instead of inventing a fake "Jane Doe paid rent" line — a real landlord's own dashboard shouldn't
  show a transaction that didn't happen. Occupied and the chart reuse the same "fully occupied"
  placeholder logic the dashboard already had. The header's "+" now actually opens Add Property.
- **Property detail screen** (`properties/[id]/index.tsx`) brought up from completely unstyled
  (plain list, blue `#1565c0` accent, no header) to match the new design: custom header (back +
  name + add-unit), property photo with a property-type badge overlaid, address + a decorative
  "Monthly" pill, a Summary 2×2 grid (Rent Collected/Rent Due `—`, Occupied % placeholder, Open
  Request `0`, same honesty reasoning as the dashboard), and a horizontally-scrollable unit list.
  This screen is intentionally **outside** the tab navigator (root-level route, per the existing
  documented reasoning below about shared back-navigation), so unlike the reference mock, the
  floating tab bar does not show on this screen — not changed, since altering that would undo a
  previously deliberate fix.
- **Add Property and Add Unit forms redesigned again** — the properties list/add-property pass from
  2026-08-28 used a different accent color per property type (teal/purple/blue/orange), which meant
  memorizing an arbitrary color-to-type mapping. Replaced with **one accent (orange), only shown on
  the selected tile** — plain gray icon otherwise — on both the property-type grid and the new
  unit-type grid on Add Unit (which was previously fully unstyled: default blue chips, bordered
  inputs, no header at all, relying on the native modal header). Both forms now share the same
  field style (white pill, gray icon, no colored badge) and the same Cancel/primary orange pill
  button pair.
- **Real bug found and fixed: dark-theme background bleeding through the floating tab bar.**
  `_layout.tsx` was switching between React Navigation's `DarkTheme`/`DefaultTheme` based on
  `useColorScheme()`, but no screen in this app has actual dark-mode styling — every screen
  hardcodes light colors. On a device/browser in dark mode, `DarkTheme.colors.background` (black)
  showed through the tab bar's reserved bottom padding (`app-tabs.tsx`'s `TabSlot` has
  `paddingBottom: 90` that no screen content covers). Fixed by dropping `DarkTheme`/`useColorScheme`
  and hardcoding `ThemeProvider value={DefaultTheme}` until the app actually gets dark-mode
  support. Also gave that same reserved padding an explicit `backgroundColor: "#f5f6fa"` (matches
  every screen's own background) so the tab bar reads as just a floating shadowed pill with no
  visible box behind it, and swapped the tab bar's deprecated `shadowColor`/`shadowOpacity`/
  `shadowRadius`/`shadowOffset` (silently broken on web, rendered as a hard black edge instead of a
  soft shadow) for the cross-platform `boxShadow` style.
- **Real bug found and fixed: login never actually worked.** There was no `.env` file at all in this
  repo, so `EXPO_PUBLIC_BACKEND_API_URL` was `undefined` and every backend call was silently going to
  a broken URL. Found the real value in the sibling `rent-manager-frontend` repo's own `.env.local`
  (same Azure backend both apps use) and created `rent-management-mobile/.env.local` with just
  `EXPO_PUBLIC_BACKEND_API_URL` (not the web repo's unrelated `SESSION_SECRET`). **This file is
  gitignored and not committed** — anyone pulling this repo fresh (new machine, new agent) needs to
  recreate it with the same value before login will work. Verified end-to-end after: invalid
  credentials correctly show "Invalid email or password" from the real backend, and valid login
  reaches the real dashboard with real property/unit data.
- Verified every change in the web preview (`npx expo start --web`) — screenshots of every screen,
  real backend calls with a real logged-in session (not mocked), zero new console errors, `npx tsc
  --noEmit` clean after each step. Deleted `assets/images/onboarding-hero.jpg`, a stock photo this
  session downloaded as a first-pass placeholder before the user swapped in their own onboarding
  photo (`app-onboarding-picture.jpg`) — confirmed zero references before removing it.
- **Next step**: Tenants tab, Profile tab, and the Forgot Password screen are the only remaining
  screens still on old/default styling — not brought into the new design language this session since
  they weren't part of what was asked. Tenants tab is still a stub (per the 2026-08-28 entry).

## 2026-08-28 — Claude (Windows) extended the design pass to properties, and bumped Node to 24

- **Environment**: Node upgraded 21.6.2 → 24.19.0 (Active LTS as of this date; 22 moved to
  Maintenance LTS in Oct 2025) via `winget install OpenJS.NodeJS.LTS`, replacing the prior direct
  MSI install. Expo SDK 57 requires ≥22.13.x per its own docs, so this is comfortably above floor.
- **Resolved the "known inconsistency" flagged in the entry below**: the Properties tab list
  (`(tabs)/properties.tsx`) and the Add Property form (`properties/new.tsx`) were still on the old
  blue (`#1565c0`) accent from before the dashboard/login design pass. Both are now on the same
  deep teal-green (`#16302b`) / teal (`#2f8a75`) / orange (`#d9601f`) / blue (`#1f6fd9`) palette as
  the dashboard, mocked up with the `visualize` tool across several iterations (icon-badge stat
  tiles, then square tiles, then the taller icon+trend+divider+"View all" tile style; photo-style
  property cards with an icon-tile placeholder, "Active" badge, and Units/Tenants stat pills;
  simplified header — back button inline with the title, no extra grid button) before writing code,
  same workflow as the earlier dashboard/login pass. Login's header gradient was also corrected from
  its original blue to the same dark green, which had been missed earlier.
- **Add Property form redesigned to match**: icon-prefixed fields, and the property-type picker
  changed from plain text chips to a 2-column icon grid (color/icon chosen by keyword-matching the
  type name — condo/duplex/mobile/town/apartment each get a distinct tint from the same palette).
- **Two real bugs found and fixed during this pass**:
  - `properties/new` had a duplicate header — the root `_layout.tsx` `Stack.Screen` still had
    `headerShown: true, title: "Add property"` from before the screen had its own in-content header,
    so Expo Router's native stack header was rendering on top of the custom one. Removed the
    now-redundant `headerShown`/`title` options (`presentation: "modal"` stays).
  - Property type names come back from the backend as unspaced PascalCase (`SingleFamilyHouse`,
    `MobileHome`) — both the properties list badges and the add-property type grid now run them
    through a small `formatPropertyType` regex helper (`([a-z0-9])([A-Z])` → insert a space) before
    display. (Duplicated in both files for now rather than shared — small enough that it wasn't
    worth introducing a shared lib module for two call sites.)
- **Known placeholders, not real data yet** (flagged in-code with comments, same pattern as the
  dashboard's existing occupancy placeholder): every property card's "Active" badge is hardcoded
  (no property-status field exists in the backend model yet), and the "Tenants" stat pill is
  hardcoded to `0` (no tenant-to-unit relationship exists yet either). The three stat-tile
  "View all" links and the search filter button are visual-only (`comingSoon()` alert), since none
  of Units, Cities, or filtering have dedicated screens/logic yet.
- **Still not brought up to the new palette**: `properties/[id]/index.tsx` (property detail) and
  `properties/[id]/units/new.tsx` (add unit) — this pass covered the list and add-property screens
  only, not asked for further yet.
- Verified in the web preview (`npx expo start --web`) after every change — screenshots of
  properties list and add-property, zero new console errors (the only console errors present are
  the pre-existing CORS block on `POST /api/auth/login` from `localhost:8081` and the follow-on 401s,
  unrelated to this session's changes, not investigated further here).
- **Next step**: bring `properties/[id]/index.tsx` and `properties/[id]/units/new.tsx` onto the same
  palette/component patterns (icon tiles, stat pills, simplified header) to finish the properties
  area; then decide on tenants (still a stub) as the next real feature, per the prior entry.

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
