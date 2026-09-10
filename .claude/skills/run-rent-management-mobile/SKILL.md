---
name: run-rent-management-mobile
description: Build, run, and drive the DomusPRO React Native/Expo mobile app. Use when asked to start rent-management-mobile, run its web build, take a screenshot of its UI, or interact with the running app (onboarding, login, properties, etc).
---

This is an Expo Router app (React Native + Expo SDK 57). It's driven as a web
app through the Claude Code Desktop Browser pane (`mcp__Claude_Browser__*`
tools) — there's no custom driver script to write or maintain, because
`.claude/launch.json` already defines the dev-server entrypoint (`expo-web`)
and the Browser pane's `preview_start`/`computer`/`find`/`read_page` tools are
the harness.

All paths below are relative to repo root.

## Prerequisites

Node.js + npm on PATH (already the case in this environment). No OS packages,
no headless-Chromium setup — driving happens through the Browser pane, not a
locally-launched browser process.

## Setup

```bash
npm install
```

Requires `.env.local` with `EXPO_PUBLIC_BACKEND_API_URL` set — already present
in this repo. It points at the **real** backend API, not a mock/test server.

## Build

No separate build step. `expo start --web` bundles with Metro on the fly.

## Run (agent path)

Launch through the Browser pane using the `expo-web` config already defined
in `.claude/launch.json` (runs `npm run web`, binds port 8081):

```
preview_start({ name: "expo-web" })
```

This returns a `serverId` (for `preview_logs`/`preview_stop`) and a `tabId`
(for every other Browser tool). **Don't screenshot immediately** — poll
`preview_logs({ serverId })` until a line like this appears:

```
Web Bundled 23026ms node_modules\expo-router\entry.js (1385 modules)
```

On a cold Metro cache (first run, or after `node_modules`/deps change) this
takes roughly 60–90s across ~15 SSR render passes before the client bundle
finishes; before that line shows up, the tab's early navigations fail
outright (`ERR_CONNECTION_REFUSED`) rather than rendering a blank page. With
a warm cache (Metro already ran once and wasn't killed) a restart bundles in
a few seconds instead — still wait for the log line rather than assuming
either timing.

Then drive it, e.g.:

```
computer({ action: "screenshot", tabId })              # onboarding screen
find({ query: "Get Started", tabId })                  # -> ref_N
computer({ action: "left_click", ref: "ref_N", tabId })
computer({ action: "screenshot", tabId })               # Log In screen
read_console_messages({ onlyErrors: true, tabId })      # should be empty
```

Stop the server with `preview_stop({ serverId })` when done.

## Run (human path)

```bash
npm run web   # starts Metro, serves http://localhost:8081; Ctrl-C to stop
```

Useless for an agent — no window opens in a way you can drive without the
Browser pane above.

## Test

No test suite is configured yet. `npm run lint` runs `expo lint`.

## Gotchas

- `computer` with a raw `coordinate` requires a `computer{action:"screenshot"}`
  already taken *in the current tool session* to cache the coordinate frame.
  Click via `find()`'s returned `ref_N` instead of guessing pixel coordinates
  — it works without a prior screenshot and survives layout shifts.
- The first 3–4 navigation attempts to `localhost:8081` return
  `ERR_CONNECTION_REFUSED` while Metro is still starting up. Poll
  `preview_logs` for the `Web Bundled` line rather than using a fixed sleep.
- `EXPO_PUBLIC_BACKEND_API_URL` in `.env.local` points at the real backend —
  don't actually submit the login form with real credentials during an
  automated smoke run; verifying the screen renders and navigates is enough.
