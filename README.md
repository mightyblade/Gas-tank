# Gas Tank Tracker

A lightweight browser app for tracking fuel usage, payments, and balances for multiple drivers.

## Features

- Separate landing page with links to each driver.
- Dedicated driver pages for logging fuel usage and payments.
- Admin-only page for adding drivers and updating gas price.
- Data persists locally in the browser via `localStorage`.

## Pages

- `index.html` — landing page with driver links.
- `driver.html?id=<driver-id>` — per-driver page.
- `admin.html` — password-protected admin settings.

## Getting started

Open `index.html` directly in a browser or serve the directory with a simple web server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.
