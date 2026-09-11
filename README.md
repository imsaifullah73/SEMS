# SEMS — Student Expense Management System

A full-stack expense tracker built for students. No banking bloat — just recording expenses and income, setting budgets you can actually stick to, and charts that make your spending easy to understand.

**Live demo:** https://sems-production-0982.up.railway.app/

![Version](https://img.shields.io/badge/version-0.4.0-informational)
![JS](https://img.shields.io/badge/JS-ES%20Modules-yellow)
![No Framework](https://img.shields.io/badge/frontend-vanilla-orange)
![Node](https://img.shields.io/badge/Node.js-18-green)
![Express](https://img.shields.io/badge/Express-4-blue)
![DB](https://img.shields.io/badge/PostgreSQL-316192)
![Prisma](https://img.shields.io/badge/Prisma-5-blueviolet)
![License](https://img.shields.io/badge/license-MIT-green)
![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen)

---

## Why I built this

I'm a student. Every money app I tried was either a corporate dashboard wearing a friendly skin, or it demanded bank-account access I didn't want to give it. So I built my own. This started as "I need to track my mess bills" and kept growing — it's now a REST backend with JWT auth, OTP email verification, and a production deployment on Railway. All of it built one phase at a time, no framework, no build step.

## Features

**Expenses & income**
- Categorized transactions with amount, date and description
- Search with debounced input, filter by category or month
- Month summary cards that show where the month currently stands

**Budgets**
- One overall monthly budget for keeping the whole month in check
- Per-category limits (food, transport, books) with their own ceilings
- Progress bars that change color as you approach the limit
- A warning the moment you cross the line

**Reports**
- Income vs expense charts bucketed by day, week, month or year
- Doughnut chart showing spending breakdown by category
- One-click CSV export that opens fine in Excel / Google Sheets

**Accounts**
- Email + password registration with JWT sessions
- Email OTP verification on signup (kills throwaway accounts)
- Forgot / reset password flow with OTP
- All passwords and OTPs hashed with bcrypt

**Extras**
- Light and dark themes backed by CSS design tokens, persisted per user
- Accessible UI — focus-trapped modals, keyboard navigation, aria labels
- Public testimonials and a feedback form with profanity + spam filtering
- Founder controls to reply to or block comments

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES Modules) — no framework, no build step |
| Charts | Chart.js 4 via CDN |
| Backend | Node.js + Express 4 REST API |
| Database | PostgreSQL (SQLite dev fallback) |
| ORM | Prisma 5 |
| Auth | JWT + bcryptjs |
| Email | EmailJS (OTP, welcome, password reset) |
| Hosting | Railway (Nixpacks) |

## Project Structure

```
sems/
├── index.html              # Landing page (hero, features, user manual, feedback)
├── login.html / register.html   # Auth with inline OTP step
├── dashboard.html          # Monthly snapshot + recent activity
├── expenses.html / income.html  # Transaction management
├── budget.html             # Overall + per-category budgets
├── categories.html         # Custom category CRUD
├── reports.html            # Charts + CSV export
│
├── css/
│   ├── base/               # Design tokens, reset
│   ├── themes/             # Light, dark, typography
│   ├── components.css      # Buttons, modals, toasts, forms
│   ├── layout.css
│   └── pages/              # One stylesheet per page
│
├── js/
│   ├── core/               # config, utils, validator, event bus
│   ├── models/             # User, Category, Expense, Income, Budget
│   ├── storage/            # StorageAdapter (swaps API / localStorage)
│   ├── repositories/       # Data access layer per entity
│   ├── services/           # Business logic + validation
│   └── ui/
│       ├── components/     # AuthGuard, Modal, Toast, SidebarToggle...
│       └── pages/          # One controller per page
│
└── backend/
    ├── prisma/schema.prisma
    ├── src/
    │   ├── server.js, app.js
    │   ├── middleware/     # auth, error handler, 404
    │   ├── routes/         # auth, categories, expenses, income, budgets, comments
    │   ├── controllers/
    │   └── utils/          # mailer, token gen, comment filter
    ├── scripts/seedComments.js
    └── railway.json
```

## How It's Organized

The frontend follows a layered architecture:

```
Page Controller -> Service (validation) -> Repository -> Storage Adapter -> API | localStorage
```

A few choices worth mentioning:

- The `StorageAdapter` interface lets the whole app switch between localStorage and the REST API without touching a single repository. That is literally how this project grew from a client-side app into a full-stack deployment.
- An event bus (`eventBus.js`) keeps modules decoupled — the budget page listens for `expense:created` and re-renders on its own, no tangled imports.
- Every protected page runs through an `AuthGuard` that checks the JWT before any UI renders.

The project was built in 15 deliberate phases (the code comments track this), each feature landing as its own milestone, which is probably why it never turned into a mess.

## Getting Started

Prerequisites: Node.js 18+, a PostgreSQL database (local or free-tier Neon works).

### 1. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push    # create the schema in your DB
npm run dev           # -> http://localhost:5000/api
```

### 2. Frontend

```bash
# from the project root
node dev-server.mjs   # -> http://localhost:8080
```

### 3. Or run both together

```bash
node start.mjs
# or double-click start.bat on Windows
```

This spawns the backend and frontend together.

## Environment Variables

Create a `backend/.env` (a template is in `backend/.env.example`):

```
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/sems
JWT_SECRET=your-long-random-secret
EMAILJS_SERVICE_ID=
EMAILJS_OTP_TEMPLATE_ID=
EMAILJS_WELCOME_TEMPLATE_ID=
EMAILJS_RESET_PASSWORD_TEMPLATE_ID=
EMAILJS_PUBLIC_KEY=
EMAILJS_PRIVATE_KEY=
OTP_TTL_MINUTES=10
```

Email is optional to get running. Leave the EmailJS keys blank and the app skips emails gracefully.

## API Reference

Base URL: `/api`

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/auth/register` | Create account | - |
| POST | `/auth/login` | Login, returns JWT | - |
| POST | `/auth/verify-otp` | Verify registration OTP | - |
| POST | `/auth/resend-otp` | Resend OTP | - |
| POST | `/auth/forgot-password` | Request reset OTP | - |
| POST | `/auth/reset-password` | Reset password with OTP | - |
| GET | `/auth/me` | Current user | token |
| GET/POST/PUT/DELETE | `/categories` | Category CRUD | token |
| GET/POST/PUT/DELETE | `/expenses` | Expense CRUD | token |
| GET/POST/PUT/DELETE | `/income` | Income CRUD | token |
| GET/POST/PUT/DELETE | `/budgets` | Budget CRUD, month-scoped | token |
| GET/POST | `/comments` | Public feedback | - |

## Database & Security

Six core models: `User`, `Category`, `Expense`, `Income`, `Budget`, `Comment` (self-referencing for replies). Every financial record carries a `userId` foreign key, and the store layer appends an `extraWhere` guard so no query leaks data across users — even if someone guesses an id.

10 default categories are seeded automatically at registration. Passwords and OTP codes are hashed before they hit the database.

## Things I'm Happy About

- Every page has its own controller, service and repository — no 2,000-line script tags.
- The localStorage -> live API swap required zero repository changes when the backend landed.
- Real validation on every form field, not just HTML `required` attributes.
- Modals, toasts and dialogs built from scratch — accessible, focus-trapped, keyboard-friendly.
- Money math respects the user's timezone (PK), not the server's.

## Honest Trade-offs

- No automated test suite yet — that is genuinely the next item on the list.
- Vanilla JS is a deliberate choice. React would have been overkill for this scope, and I wanted to prove I understand the DOM before leaning on a framework.
- Email goes through EmailJS to keep infra costs at zero; it degrades gracefully when not configured, but a dedicated SMTP provider would be more reliable.
- Design tokens live in plain CSS. They'd move to a JSON + build step if the theme system ever gets bigger.

## Roadmap

- Automated tests (unit + integration)
- Recurring transactions (monthly rent, subscriptions)
- CSV import from bank statements
- Expense photo receipts
- Dark mode that follows the system preference
- Mobile-first PWA

## License

MIT — use it, learn from it, build on it. See [LICENSE](LICENSE).

## About the Author

Built and maintained by Saif Ullah ([imsaifullah73@gmail.com](mailto:imsaifullah73@gmail.com)). A student who got tired of apps making personal finance feel like a corporate dashboard, so he built one for students instead. Questions, feedback, internship offers — all welcome.

## Support

If this is useful to you, a star on the repo means a lot. Found a bug or have an idea? Open an issue.