# DropStitch 🧶

A phone app for knitters: keep your patterns, count your rows, tick off each step and keep track of your yarn.

Built with [Expo](https://expo.dev) (SDK 57) and React Native, so one codebase runs on iPhone and Android.

## What's in the app

- **Home**: your current project in a big **Continue** card (row count, step, start date), plus anything else on the needles.
- **Project page**: the title and when you started, **Go to current step**, a **Notes** box that saves as you type, and the **pattern file**.
- **Current step**: a big row counter, the step's instructions, *Mark step done* / *Next step*, and an **All steps** list where you can add, paste, edit and reorder steps. The screen stays awake while you knit.
- **Pattern viewer**: PDFs and photos with a draggable row marker, and the row counter underneath so you can count while you read.
- **Projects**: active projects and finished ones, shown as colour boxes like paint chips. Finished projects keep their notes.
- **Yarn**: your stash. Add a yarn ball with its colour (30 to choose from), material, needles that fit and an optional name.

Pasted pattern text becomes steps automatically, and row counts are picked up from lines like `Rows 1-10`, `Rnd 5`, `knit 20 rows` or `repeat rows 1-4 3 times`.

Everything is stored on the phone. There are no accounts and no server.

## Design

"Strawberry matcha": strawberry (`#C45F3F`), strawberry milk (`#FFC0C0`), matcha (`#898E46`) and matcha milk (`#E3E6C3`) on a very light beige (`#FBF7F0`).

- **Fraunces Black** (soft + wonky) for big titles and row numbers. The static files in `assets/fonts` have those settings baked in.
- **Manrope** for everything else.
- **Caveat** for the little handwritten notes.

All colours and fonts live in `src/constants/theme.ts`. The line drawings are placeholders in `src/components/illustrations.tsx`, ready to be swapped for final artwork.

## Running it

You need **Node.js 22.13 or newer**. Then:

```bash
npm install
npx expo start
```

- **On your phone**: install **Expo Go**. On Android, scan the QR code from inside Expo Go; on iPhone, scan it with the Camera app. Your phone must be on the same Wi-Fi as your computer. If that doesn't work, try `npx expo start --tunnel`.
- **In a browser**: press `w`. The web version is only for quick checks during development.

To build a real installable app, use [EAS Build](https://docs.expo.dev/build/introduction/): `npx eas-cli@latest build`.

## Checks

```bash
npx tsc --noEmit   # typecheck
npx expo lint      # lint
```

## Project layout

```
src/
  app/                       Screens (Expo Router, file-based)
    _layout.tsx              Fonts, navigation stack
    (tabs)/                  Bottom menu: Home (index), Projects, Yarn
    welcome.tsx              First-launch screen
    new.tsx                  New project
    project/[id]/index.tsx   Project page
    project/[id]/knit.tsx    Current step + row counter
    project/[id]/pdf.tsx     Pattern viewer + row counter
    project/[id]/edit.tsx    Rename, files, start over, finish, delete
    yarn/new.tsx             New yarn ball
  components/                UI pieces (tab bar, project box, yarn ball, knit bar, …)
  lib/                       Step parsing, pattern files, dates, the PDF viewer page
  store/projects.ts          Projects, yarn and settings (zustand, saved with AsyncStorage)
  constants/theme.ts         Colours, fonts, spacing
```

## Notes

- PDFs are drawn with [pdf.js](https://mozilla.github.io/pdf.js/), loaded from a CDN, so the first time a PDF is opened the phone needs an internet connection.
- The app icon and splash image are still Expo's defaults.
