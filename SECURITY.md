# Security Policy

## Reporting a Vulnerability

Please **do not** open a public issue for security problems.

Email imsaifullah73@gmail.com instead. I'll try to reply within 48 hours.

Please include:

- What the issue is and how to reproduce it
- What you'd expect to happen vs what actually happens
- Any proof of concept (screenshot, payload, curl command)

## What to expect

- I'll confirm the report and triage it within a few days.
- I'll keep you updated on the fix. Since this is a one-person project,
  there's no SLA, but you'll hear from me.
- Once fixed, I'll mention you in the release notes (unless you ask not to).

## Scope

The live app at `https://sems-production-0982.up.railway.app/` and this
codebase are in scope. Third-party services SEMS depends on (EmailJS,
Railway, Nixpacks, Prisma, Express) should be reported to the vendors.

## Notes on what this project already does

- Passwords and OTP codes are bcrypt-hashed, never stored in plain text.
- OTPs are single-use and time-limited (`OTP_TTL_MINUTES`).
- Every financial query is scoped to the authenticated user via an
  `extraWhere` guard.
- JWT tokens are short-lived and validated by middleware on every
  protected route.