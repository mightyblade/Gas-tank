# Gas Tank Tracker

A lightweight browser app for tracking fuel usage, payments, and balances for multiple drivers.

## Features

- Separate landing page with links to each driver.
- Dedicated driver pages for logging fuel usage and payments.
- Admin-only page for adding drivers, updating gas price, and deleting logs.
- Shared data stored in MySQL (no local-only storage).

## Pages

- `index.html` — landing page with driver links.
- `driver.html?id=<driver-id>` — per-driver page.
- `admin.html` — admin settings.
- `login.html` — driver login (select driver, then sign in).

## DreamHost setup

1. Create a MySQL database in the DreamHost panel.
2. Import the schema:

```sql
-- Run this in phpMyAdmin or the MySQL command line.
SOURCE schema.sql;
```

3. Copy `config.php.example` to `config.php` and fill in your MySQL credentials.
4. Upload the site to your DreamHost domain (including the `api` folder).

## Passwords

- The first time you log in as **admin**, the password you enter is saved as the admin password.
- Each driver has their own password; set it from the admin page under Drivers.
- Drivers log in and are taken directly to their driver page, with optional access to the landing page.

## Getting started (local)

```bash
php -S localhost:8000
```

Then visit `http://localhost:8000/login.html`.

## Database updates

If you already created the tables before adding driver passwords, run:

```sql
ALTER TABLE drivers ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL;
```
