# Release PR Day 10

Use this content for PR from release/2026-04-15-production to main.

## Suggested PR title
release: Day 10 production snapshot (v0.1.0-day10)

## Summary
- Stabilized core user and admin flows.
- Added and passed frontend E2E regression suite for major flows.
- Completed release checklist, smoke checklist, and rollback runbook.
- Locked release by branch and tag.

## Release refs
- App repo branch: release/2026-04-15-production
- App repo tag: v0.1.0-day10
- Demo repo branch: release/2026-04-15-production
- Demo repo tag: v0.1.0-day10-demo

## Scope included
- Auth flow and OAuth callback handling
- Booking and payment flow
- Profile and favorites flow
- Admin dashboard flows
- Chat and promotion related updates
- E2E automation with Playwright

## Validation done
- Frontend E2E: npm run e2e
- Manual smoke checklist prepared
- Rollback runbook prepared

## Required checks before merge
- Backend tests green on release branch
- Frontend lint and build green on release branch
- Manual smoke pass in staging

## Deployment plan
1. Deploy backend with production env
2. Deploy frontend with NEXT_PUBLIC_API_URL pointing to production API
3. Run smoke checklist
4. Monitor logs and API error rate

## Rollback plan
- Revert to previous release tag
- Restore DB backup if schema/data rollback is needed
- Re-run smoke checks

## Notes
- Keep this PR as the only source for production release decision.
- Any new feature work should continue on a separate branch.
