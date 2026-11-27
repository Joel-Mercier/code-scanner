# Code Scanner

<p align="center">A fully offline QR code, barcode and document scanner for Android and iOS, built with React Native, Expo and Skia.</p>

[![CI](https://github.com/Joel-Mercier/code-scanner/actions/workflows/ci.yml/badge.svg)](https://github.com/Joel-Mercier/code-scanner/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/Joel-Mercier/code-scanner)](https://github.com/Joel-Mercier/code-scanner/blob/main/LICENSE.txt)
[![Latest release](https://img.shields.io/github/v/release/Joel-Mercier/code-scanner)](https://github.com/Joel-Mercier/code-scanner/releases/latest)

## Table of contents

- [Features](#features)
- [Development](#development)
- [Privacy](#privacy)

## Features

### Scanning (home screen)

- **Codes ⇄ Docs switch** at the top of the scanner
- **Live code scanning** of QR, Aztec, Codabar, Code 39/93/128, Data Matrix, EAN-8/13, ITF-14, PDF417 and UPC-A/E. The Skia reticle snaps onto the detected code, then the capture spins into view as a 3D object
- **Scan from a photo** in the gallery
- **Document scanning** with the system scanner (VisionKit on iOS, ML Kit on Android): edge detection, cropping, multi-page, and a PDF plus page images saved permanently in the app
- **Import** photos or a PDF file as a document, from the Docs mode or by sharing them to the app from any other app
- **Smart results**: open links, write emails, call, send SMS, copy Wi-Fi passwords, add contacts or calendar events, open locations in maps, search the web for product barcodes. Payloads are parsed by the app itself, so the same actions work on iOS and Android
- Pinch-to-zoom and torch

### Collection

- Codes and documents in **one place**, each with a catalogue number, grouped by month
- **Nested folders** with a colour and an icon
- A strip of the 11 kinds of objects, showing which ones you have found
- Search across folder names, item names, code content and the text of documents, filter All / Codes / Documents / Folders
- Move, rename, share, pin and delete via long press or the ⋮ menu; multi-select to move, delete, share, pin or merge documents in bulk
- **Pinned** items stay at the top of the collection and on the home screen

### Documents

- Full-screen reader with pinch and double-tap zoom
- **Edit pages**: reorder, rotate, remove, or add pages by scanning or from photos; the PDF is rebuilt on the device
- **Text recognition on the device**: search the collection by what's written on the pages, copy a document's text
- **Codes found on pages** (a QR code on an invoice, a ticket's barcode) listed on the document, one tap to open them
- Type (receipt, invoice, ID…) and notes; share, save to files, print, or save the pages to photos

### Backup

- Back up the whole collection (codes, documents, folders, logos) to a single .zip, and restore it on any phone: restoring adds what's missing without replacing anything

### Create

- **QR codes**: link, text, Wi-Fi, email, phone, SMS, contact (vCard), event (iCalendar) and location
- **Barcodes**: every type listed above, generated **offline** with [bwip-js](https://github.com/metafloor/bwip-js) (no external API)
- Live Skia preview, ink and background colours, square / rounded / dot modules and a centre logo
- Save to the collection, share, or export a high-resolution PNG to the gallery

## Development

### Technical Stack

- **Expo SDK 58**, React Native 0.88, React 19.3, React Compiler, TypeScript 6
- **Navigation**: expo-router (native stack)
- **Lists & sheets**: `@legendapp/list`, `@gorhom/bottom-sheet`
- **Graphics & motion**: `@shopify/react-native-skia`, `react-native-reanimated` 4, `react-native-gesture-handler` 3, `expo-haptics`
- **Camera & scanning**: `expo-camera` (live scanning, image scanning, document scanner)
- **Code generation**: `@paulmillr/qr` (QR matrix), `bwip-js` (barcodes), both rendered as Skia paths
- **State**: zustand persisted to `react-native-mmkv`; files in `expo-file-system`
- **Validation**: zod (localised messages)
- **i18n**: i18next / react-i18next
- **Tooling**: Bun, Biome, EAS Build

### Prerequisites

- Node.js `26.12.0` or higher (see `.nvmrc`)
- [Bun](https://bun.sh) `1.4.3` (see `.bun-version`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

```bash
git clone <repository-url>
cd code-scanner
bun install
```

### Run

```bash
bun run android   # build & run on Android
bun run ios       # build & run on iOS
bun run start     # start Metro for an installed dev build
```

### Checks

```bash
bun run typecheck
bun run lint
```

### Building for Production

Local EAS builds, written to the gitignored `tmp/` folder:

```bash
bun run build:android:preview         # tmp/code-scanner-preview-<version>.apk
bun run build:android:production      # tmp/code-scanner-<version>.aab (Play Store)
bun run build:android:production-apk  # tmp/code-scanner-<version>-arm64-v8a.apk
bun run build:android:development     # tmp/code-scanner-dev-<version>.apk (dev client)
```

`<version>` comes from `package.json`, so keep it in sync with `app.json`. Preview and development builds get their own app id (`com.jmercier.codescanner.preview` / `.dev`, see `app.config.js`), so they install alongside the production app.

The `android/` and `ios/` folders are not committed: they are generated by `expo prebuild` (Continuous Native Generation) from `app.json`, so all native configuration belongs there. Run `bun run prebuild` (or `prebuild:development` / `prebuild:preview` / `prebuild:production` for a given app variant) after changing `app.json` or upgrading native dependencies, before a local `bun run android` / `bun run ios`.

### Project Structure

```
src/
├── app/          Routes (expo-router), thin: each renders a feature screen
├── features/     One folder per screen area: scanner, capture, code, document, create, library, settings
├── components/
│   ├── ui/       Design system (text, icons, buttons, lists, sheets, 3D turntable…)
│   └── codes/ documents/ library/   Domain UI shared by several features
├── domain/       Pure TypeScript: payload parsing/building, formats, models, migrations
├── stores/       zustand stores persisted in MMKV (library, settings)
├── services/     File system, sharing, document scanner
├── theme/        Tokens (light/dark), shared styles, layout insets, motion
├── lib/          Helpers: storage, haptics, dates, colours…
└── i18n/         i18next setup and translations (en, fr)
```

See [`CLAUDE.md`](CLAUDE.md) for the dependency rules and conventions.

## Privacy

Everything runs on the device: no account, no analytics and no network calls. See the in-app privacy page.
