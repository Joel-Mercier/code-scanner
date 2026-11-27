# Code Scanner

Offline QR code, barcode and document scanner for Android and iOS (Expo SDK 58, React Native 0.88, React 19 + React Compiler, TypeScript). No account, no network calls: everything stays on the device.

## Features

- **Scanner** (home, `/`): live scanning of QR and 12 barcode formats, scanning from a photo, pinch zoom, torch. Swipe to **Docs** mode for the system document scanner (VisionKit / ML Kit), which saves page images and a PDF, or import photos / a PDF file (also the fallback when the device has no scanner).
- **Documents** (`/document/[id]`): page carousel, full-screen reader with zoom (`/document/[id]/view`), page editor (`/document/[id]/pages`: reorder, rotate, remove, add by scan or photos; the PDF is rebuilt on save with `pdf-lib`), type and notes, share / save / print the PDF, save pages to photos. Pages are read on the device in the background (`prepareDocument`): text (expo-text-extractor: Vision / ML Kit) for search and copy, and the codes printed on them. Select several documents to merge them into one.
- **Import** (`/import`): photos and PDFs shared from other apps (expo-share-intent: iOS share extension, Android SEND intents), saved as documents or searched for codes.
- **Capture** (`/capture/[id]`): the new item spins in as a 3D object, with quick actions.
- **Code** (`/code/[id]`): the code, its smart actions and decoded fields. Tap the code to show it full screen (`/code/[id]/show`) at full brightness, kept awake, to be scanned at a till or a gate; touch and hold to turn it.
- **Locks**: lock the whole app and/or single codes and documents (⋮ menu, or the selection's More). Unlock with the phone's own lock (Face ID / fingerprint / passcode), an app password (salted PBKDF2-SHA256, derived natively by `modules/pbkdf2` off the JS thread; deliberately no JS fallback, far too slow on a phone, so a build without the module throws `MissingNativeModuleError`; tests use Node's PBKDF2 from `@/test/derive`), or a TOTP code from an authenticator app; both secrets live in the secure store. Locked items show a lock instead of their content in tiles, sheets and search until unlocked; one unlock opens them all until the app spends `lockAfter` in the background. Wrong guesses are throttled. Setting up a password or authenticator ends with a one-time recovery code (kept hashed); "Forgot it?" unlocks with the phone's lock or that code, then drops the forgotten secret and falls back to the phone's lock until a new one is set. Locks don't encrypt files.
- **Smart actions**: the app parses payloads itself (URL, Wi-Fi, e-mail, phone, SMS, vCard/MECARD, iCalendar, geo) to open, call, copy the password, add a contact or event… Barcodes get a web search.
- **Collection** (`/library`): codes and documents with catalogue numbers, grouped by month, pinned items on top, nested folders (colour + icon), kind strip, filters, search (including documents' text and notes). Long press an item to multi-select it, then move, delete, or (under More) share, pin and merge documents from the floating `SelectionBar`; long press a folder (or a recent item on the home screen) for its rename / share / pin / move / delete sheet.
- **Create** (`/create`): QR codes (9 payload kinds) and 11 barcode formats generated offline, with ink and paper colours, dot style and a centre logo. Save, share as PNG, or save to the gallery.
- **Settings**: language (en / fr), theme (system / light / dark), haptics, 3D motion, lock (method, app lock, delay), backup / restore of the whole collection (a .zip with `library.json`, document files and logos; restoring merges, never replaces), plus help and privacy pages.
- **Automatic backups** (Android only): a .zip a day into a SAF folder the user picked, around a chosen time, keeping the newest N (only files named `code-scanner-auto-backup-*.zip` are ever deleted). `modules/auto-backup` (WorkManager) runs with the app closed and only starts JS when the native `pending` flag says the library changed; a run due while the app is in front waits until it's left. Wired from the entry file `index.ts` (`startAutoBackupScheduler`), not a screen. iOS has no lasting folder grant, and the app's Documents directory holds document pages, so it can't be opened to the Files app just for backups.

## Architecture

Everything lives in `src/` (`@/` = `src/`).

```
src/
├── app/            Routes (expo-router). Thin: read params, render a feature screen, export ErrorBoundary
├── features/       One folder per screen area, private to it: <Name>Screen.tsx + components/ + hooks/
│   └── scanner · capture · code · document · create · library · settings · errors
├── components/
│   ├── ui/         Design system. Knows nothing about codes or the library
│   ├── codes/      Code rendering (Skia geometry, CodeArt/CodeFace/CodeObject), actions, PNG export, 3D motion hooks
│   ├── documents/  Document objects and thumbnails
│   ├── library/    Item tiles, folder form/picker, item actions sheet, route hrefs
│   └── lock/       App / item locks: unlockItems / confirmIdentity, LockOverlay (root), LockPad, LockedItem, useRevealed / useModalGuard
├── domain/         Pure TypeScript, unit-testable: payload parse/build, formats, code styles, library models, folder tree, migrations, security (TOTP, password hashing, throttling)
├── stores/         zustand stores persisted in MMKV: library (items, folders), settings, autoBackupStatus; lockSession (in memory only)
├── services/       Native side effects: document files and scanner, PDF building, page reading (OCR, codes), backup archives, gallery, logo files, share sheet, lock (local auth, secure store), brightness, automatic backups (native module, folder writing)
├── theme/          Tokens (light/dark palettes, radii, shadows), fonts, makeStyles/useTheme, shared styles, layout insets, motion
├── lib/            Helpers: MMKV storage, haptics, date formatting, colours, ids, attempt(), SAF folder URIs
├── i18n/           i18next setup (+ zod messages) and locales/en.ts, fr.ts
└── test/           Test helpers only: fixtures (makeCode, makeDoc, makeFolder, byId), fake file system handle
```

**Dependency rules** (imports only point down this list):

`app → features → components/{codes,documents,library,lock} → components/ui → theme → stores → services → domain · lib · i18n`

- A feature never imports another feature. Something two features need moves down to `components/` or `domain/`.
- `domain/` has no React, React Native or native modules (only `i18n` for labels).
- `components/ui` never imports from `domain/`, `stores/` or other `components/` folders.

## Conventions

- **Styles**: `const useStyles = makeStyles(({ colors }) => ({ … }))` at module level, plus `useSharedStyles()` for common fragments. Take colours from `useTheme()`, never hard-coded, except code ink/paper (`domain/codes/style.ts`): codes are always printed dark on light.
- **Motion**: entrances come from `theme/motion.ts` (`enter.up/lift/pop/fade`, `ease`). Code spins and tilts go through `components/codes/motion.ts`, which respects the 3D setting. Reanimated shared values use `.get()` / `.set()`.
- **Haptics**: go through `lib/haptics` (respects the setting). `Button`, `IconButton` and `ListRow` already tap.
- **Strings**: every user-facing string goes in both `i18n/locales/en.ts` and `fr.ts`, under `app.*`.
- **Persisted data**: if you change the library's persisted shape, bump `LIBRARY_VERSION` and add a step in `domain/library/migrations.ts`. The settings store's key is `"app"`: don't rename it.
- **Document files**: a document stores its pages and PDF as **file names** inside `documents/<id>/`, never absolute URIs (iOS moves the app's container). Resolve them with `pageUri` / `pageUris` / `pdfUri` from `services/documents`. Page names change whenever the image does, so image caches never show an old page.
- **Errors**: wrap async native calls in `attempt()` (React Compiler can't optimise try/catch in components), then toast on failure. Every route exports `ErrorBoundary`.
- **Locks**: anything that shows a locked item's content checks `useRevealed(item)` (tiles, titles via `shownTitle`, search via `matchesQuery(…, revealed)`); actions that need it (share, rename, delete, merge, backup) `await unlockItems()` first; loosening a lock `await confirmIdentity()`. Screens show `<LockedItem>` while hidden. Native modal screens (`fullScreenModal`) sit above `LockOverlay`, so they call `useModalGuard()` and hide / close themselves.
- **Sheets**: `Sheet` + `useSheetPages` for multi-step sheets. Hooks such as `useLibraryActions` / `useFolderPicker` return `{ open, element }`: render `element` once in the screen.

## Tests

- Jest (`jest-expo` preset). Tests sit next to the code as `*.test.ts`. They cover the logic: `domain/`, `lib/`, `i18n/`, `services/`, `stores/`, code geometry and export, and the pure parts of features (`qrForms`, `barcodeOptions`, library `rows` and `selection`, `saveToGallery`). Screens and hooks aren't tested.
- New logic gets a test. Keep it pure where possible (`domain/`, or a plain `.ts` next to the screen) so it can be tested without rendering.
- Mocks: `jest.setup.ts` replaces MMKV with an in-memory store. `__mocks__/expo-file-system.ts` is an in-memory file system, used automatically; seed and inspect it through `fileSystem` from `@/test/fileSystem`. Mock other native modules per test with `jest.mock`.
- Skia: files that build paths start with `/** @jest-environment @shopify/react-native-skia/jestEnv.js */` and import `@shopify/react-native-skia/jestSetup.js` (real CanvasKit). `drawAsImage` needs a stub.
- `i18n` and `settings` are module singletons: reset the language or settings you change in `afterEach`.

## Main dependencies

- `expo-router` (native stack, typed routes) · `expo-camera` (live, photo and document scanning)
- `expo-local-authentication` · `expo-secure-store` · `expo-crypto` · `@noble/hashes` (locks) · `expo-brightness` · `expo-keep-awake` (full-screen code)
- `pdf-lib` (PDFs from pages) · `expo-text-extractor` (on-device OCR) · `react-native-pdf-thumbnail` (imported PDF pages) · `expo-image-manipulator` (rotate / re-encode pages) · `expo-print` · `expo-document-picker` · `expo-share-intent` · `fflate` (backup zips)
- `@shopify/react-native-skia` (code drawing, PNG export) · `@paulmillr/qr` (QR matrix) · `bwip-js` (barcodes)
- `react-native-reanimated` 4 · `react-native-gesture-handler` 3 · `react-native-worklets`
- `zustand` + `react-native-mmkv` (state) · `expo-file-system` (documents, logos)
- `@gorhom/bottom-sheet` · `@legendapp/list` · `react-native-keyboard-controller` · `reanimated-color-picker`
- `zod` (form validation, localised) · `i18next` / `react-i18next` · `date-fns`
- Tooling: Bun, Biome (lint + format, tabs, double quotes), EAS Build

## Commands

```bash
bun run typecheck   # type check (bun check)
bun run lint        # biome check (lint:fix to apply)
bun run test        # jest (jest-expo)
```

Local native modules live in `modules/` (`wifi`, `auto-backup`, `pbkdf2`). `android/` and `ios/` are generated by `expo prebuild` (CNG), so native config belongs in `app.json` / `app.config.js` (app variants) / `plugins/`. **Agents: stop at typecheck + lint. Don't run prebuild, `expo run:*`, EAS or simulator builds: the maintainer builds and checks on a device.**
