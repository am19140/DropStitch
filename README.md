# DropStitch 🧶

A phone app for knitters: keep your patterns, count your rows, tick off each step and keep track of your yarn.

Built with [Expo](https://expo.dev) (SDK 57) and React Native, so one codebase runs on iPhone and Android.

## What's in the app

- **Home**: your current project in a big **Continue** card (row count, step, start date), plus anything else on the needles.
- **Project page**: the title and when you started, **Go to current step**, a **Notes** box that saves as you type, and the **pattern file**.
- **Current step**: a big row counter, the step's instructions, *Mark step done* / *Next step*, and an **All steps** list where you can add, paste, edit and reorder steps. The screen stays awake while you knit.
- **Pattern viewer**: PDFs and photos with a draggable row marker, and the row counter underneath so you can count while you read.
- **Projects**: active projects and finished ones, shown as colour boxes like paint chips. Finished projects keep their notes.
- **Yarn**: your stash. Add a yarn ball with its colour (8 to pick from, or any colour from the picker), how it looks (fine, smooth or chunky), material, needles that fit and an optional name.
- **Account and Settings**: sign in with email or Google, reset a forgotten password, sign out or delete your account, and open the privacy policy.

Pasted pattern text becomes steps automatically, and row counts are picked up from lines like `Rows 1-10`, `Rnd 5`, `knit 20 rows` or `repeat rows 1-4 3 times`.

Everything is kept on the phone first, so the app works offline. Once you sign in, projects, yarn and pattern files are saved to your account with [Supabase](https://supabase.com) and show up on every phone you sign in on. Without an account the app works as before, with everything on the phone.

## Design

Purl, a grandma sheep, in her hand-painted paintings on a sky-blue wave (`#80ABD7`) at the top of the main screens. Pages are cream (`#FFFCF4`) with light-blue cards (`#F3F6FB`, border `#E1E9F4`).

- **Chocolate** (`#2A1C18`) for buttons and text, **cobalt** (`#034FC9`) for progress and RS/WS, and **red** (`#F51614`) only for small accents.
- **Nunito** everywhere, from Black for big titles and row numbers down to Regular.

All colours and fonts live in `src/constants/theme.ts`. Purl's paintings are in `assets/images/purl`, and the yarn balls are painted layers in `assets/images/yarn` that take any colour.

## Running it

You need **Node.js 22.13 or newer**. Then:

```bash
npm install
npx expo start
```

- **On your phone**: install **Expo Go**. On Android, scan the QR code from inside Expo Go; on iPhone, scan it with the Camera app. Your phone must be on the same Wi-Fi as your computer. If that doesn't work, try `npx expo start --tunnel`.
- **In a browser**: press `w`. The web version is only for quick checks during development.

Accounts are off until the Supabase project's public URL and key are set: copy `.env.example` to `.env.local` and fill it in, and set up the database with `supabase/schema.sql`.

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
    _layout.tsx              Fonts, navigation stack, account sync
    (tabs)/                  Bottom menu: Home (index), Projects, Yarn
    welcome.tsx              First-launch screen
    login.tsx                Sign in, create account, forgot password
    account.tsx              Your profile
    settings.tsx             Account, help, privacy policy
    new.tsx                  New project
    project/[id]/index.tsx   Project page
    project/[id]/knit.tsx    Current step + row counter
    project/[id]/pdf.tsx     Pattern viewer + row counter
    project/[id]/edit.tsx    Rename, files, start over, finish, delete
    yarn/new.tsx             New yarn ball
  components/                UI pieces (tab bar, project box, yarn ball, knit bar, …)
  lib/                       Step parsing, pattern files, dates, the PDF viewer page, Supabase sign-in and sync
  store/projects.ts          Projects, yarn and settings (zustand, saved with AsyncStorage)
  constants/theme.ts         Colours, fonts, spacing
supabase/                    Database setup and the sign-up / password emails
website/                     dropstitch.io: landing page, privacy policy, email confirmed, password reset
```

## Notes

- PDFs are drawn with [pdf.js](https://mozilla.github.io/pdf.js/), which ships inside the app, so patterns open without an internet connection. After changing the `pdfjs-dist` version, run `npm run pdfjs`.
- The app icon is Purl's head.
