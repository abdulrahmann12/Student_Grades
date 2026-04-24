# Student Grades Upload UI

React + Vite frontend for configuring grade uploads, generating the request JSON, previewing the payload, and sending it to an existing API.

## Stack

- React + TypeScript
- Vite
- Tailwind CSS
- xlsx for browser-side Excel parsing

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Structure

```text
student-grades-ui/
  src/
    components/
    hooks/
    services/
    types/
    utils/
```

## Notes

- The UI expects a `StudentID` column and the configured degree columns in the uploaded `.xlsx` file.
- Saved subject presets are stored in `saved-subjects.json` in the project root when the app runs through Vite.
- Authentication is handled by the local Vite server. Put `AUTH_USERNAME` and `AUTH_PASSWORD` in the workspace `.env`, and the server will log in automatically, cache the JWT in `Codes/token.json`, and inject the bearer token when requests are sent.

# Student Grades Upload Tool UI

A Vite + React + Tailwind frontend for uploading an Excel sheet, configuring subject metadata, previewing the generated payload, and sending it to an existing grades API.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Project structure

```text
student-grades-ui/
  src/
    components/
    hooks/
    services/
    types/
    utils/
```