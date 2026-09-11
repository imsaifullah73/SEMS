# Changelog

All notable changes to SEMS are tracked here. The format loosely follows
[Keep a Changelog](https://keepachangelog.com), and this project uses
loose phase numbers instead of strict semver — it's a learning project that
grew in 15 phases.

## [Unreleased]

- Automated tests (unit + integration) — validation is already isolated in
  services so the DOM won't get in the way.
- Recurring transactions (monthly rent, subscriptions).
- CSV import from bank statements.

## [0.4.0] — 2026-02

### Added
- Forgot / reset password flow: bcrypt-hashed single-use OTP, email via
  EmailJS, frontend modal. Reuses the existing OTP template when no
  dedicated reset template is configured.
- Secure OTP storage (hashed at rest, single-use, TTL enforced).

### Changed
- Curated the public feedback page: real, professional testimonials instead
  of placeholder content.

## [0.3.0] — 2026-01

### Added
- ApiAdapter — implements the StorageAdapter contract against the live REST
  backend. Repositories and UI controllers unchanged.
- Full backend: Express 4 + Prisma 5 + PostgreSQL, JWT auth middleware,
  error handler, 404 handler, route-level auth on all financial resources.
- Email OTP verification on signup via EmailJS (welcome email too).
- AWS-priced thought: none. This is the phase where the app became
  full-stack. Deployment on Railway (Nixpacks).

## [0.2.0] — 2025-11

### Added
- Charts: income vs expense trends (day/week/month/year buckets) and
  category breakdown doughnut via Chart.js.
- One-click CSV export that works in Excel / Google Sheets.
- Budgets: overall monthly budget + per-category limits with color-shifting
  progress bars and over-limit warnings.

## [0.1.0] — 2025-10

### Added
- Client-side expense & income tracking with the Layerd storage adapter
  (LocalStorageAdapter only at this point).
- Categories with CRUD, 10 defaults seeded on registration.
- Event bus for decoupled module communication.
- Reusable validation layer (framework-free).

### Notes
- This started as "track my mess bills" and stayed that way until it was
  useful enough to justify a backend.

[Unreleased]: https://github.com/imsaifullah73/SEMS
[0.4.0]: https://github.com/imsaifullah73/SEMS
[0.3.0]: https://github.com/imsaifullah73/SEMS
[0.2.0]: https://github.com/imsaifullah73/SEMS
[0.1.0]: https://github.com/imsaifullah73/SEMS