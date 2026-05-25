# AdPages Toolkit PWA

Offline-first Progressive Web App scaffold for quick campaign and landing-page utilities. It is intended for GitHub Pages/static hosting first, and Microsoft Store PWA packaging later after real device and packaging validation.

## Tools Included

- UTM URL builder.
- Google Ads headline and description length checker.
- LocalBusiness JSON-LD generator.
- Paid traffic launch checklist generator.

The app runs locally in the browser. It does not make network calls, collect analytics, require accounts, store credentials, or send data to AdPages/A1 Local.

## Folder

```text
apps/pwa/adpages-toolkit-pwa/
  public/index.html
  public/styles.css
  public/app.js
  public/manifest.webmanifest
  public/sw.js
  examples/tool-state.json
  scripts/check.mjs
  scripts/smoke.mjs
  README.md
  PRIVACY.md
  PUBLISH_BLOCKERS.md
```

## Local Checks

From the repository root:

```sh
npm --prefix apps/pwa/adpages-toolkit-pwa run check
npm --prefix apps/pwa/adpages-toolkit-pwa run smoke
```

Because the app is static, it can be previewed by serving `public/` with any local static server.

## Microsoft Store Path

Publish as a public web app first. Package for the Microsoft Store only after:

1. The hosted app is live over HTTPS.
2. PWA manifest and service worker pass browser install checks.
3. Icons/screenshots/support/privacy URLs are final.
4. Windows packaging with PWABuilder or equivalent has been tested.

## Later Monetisation

Keep the free PWA useful. Paid value can live in the broader AdPages toolkit through saved client profiles, branded exports, bulk campaign URL generation, report history, and local backup/import.
