# Contributing

First off — thanks for even reading this. SEMS is a one-person learning
project that turned into a real app, and any help makes it better.

## Ground rules

- Be kind. This repo is also a student's playground, and nobody should be
  scared to open a PR here.
- No framework series, please. The frontend is intentionally vanilla JS
  with ES Modules. If you're adding a feature, keep that constraint.

## What would help right now

The most useful contributions today:

1. **Automated tests** — there are zero right now, and that's the biggest
   gap. Validation lives in `js/core/validator.js` and the services
   (`js/services/*`), so they're already DOM-free. Unit tests for those and
   integration tests for the API would be huge.
2. **Bug fixes** — check the Issues tab.
3. **Docs** — the API reference lives in the README; anything unclear there
   is a valid PR.

## How to get set up

Follow the "Getting Started" section of the README to run it locally.

## Before you open a PR

- Test your change manually: backend tests (none yet), then click through
  the affected page in the browser.
- Keep the commit message short and honest, e.g.
  `fix: month filter now resets on changing the year`.
- One logical change per PR. Small PRs get reviewed faster.
- If your change touches storage or repositories, mention it in the PR
  description — those layers are the seams of the app.

## Questions

Open an issue with the `question` label, or email
imsaifullah73@gmail.com directly. Seriously, questions are welcome.