# Day 10: Release Note Draft (Tourista)

## Release Date

2026-04-15

## Features

- End-to-end regression test suite (Playwright)
- User flows: login, booking, payment, profile, favorites
- Admin dashboard: user, hotel, tour management
- API mocking for stable E2E

## Fixes

- Selector and navigation stability in E2E
- Payment and booking async handling
- Profile/favorites UI bugs

## Known Issues

- Some flows require backend to be running for full E2E
- Manual smoke test still recommended before production

## Upgrade Notes

- Run all tests and smoke script before deploy
- Backup DB and configs
- See runbook for rollback steps

---

_This is a draft. Update with any last-minute changes before release._
