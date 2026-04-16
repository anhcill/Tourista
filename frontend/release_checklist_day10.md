# Day 10: Stabilization Checklist (Tourista)

## 1. Final Regression

- [x] Run all backend unit/integration tests (`mvn test` in backend)
- [x] Run all frontend E2E tests (`npm run e2e` in frontend)
- [ ] Manual smoke test (see smoke script)

## 2. Lint & Build

- [ ] Backend: `mvnw verify` (check for errors, warnings)
- [x] Frontend: `npm run lint` and `npm run build`

## 3. Dependency Audit

- [ ] Backend: `mvnw dependency:tree` (check for vulnerable/outdated deps)
- [ ] Frontend: `npm audit` (review vulnerabilities)

## 4. Configuration & Secrets

- [ ] Confirm all secrets are in `.env`/secure vault, not committed
- [ ] Check production config (API URLs, DB, payment keys)

## 5. Database

- [ ] Backup production DB before deploy
- [ ] Apply migrations (if any)

## 6. Monitoring/Logging

- [ ] Ensure error logging is enabled (backend & frontend)
- [ ] Confirm monitoring/alerting hooks (if any)

## 7. Rollback Plan

- [ ] See runbook/rollback steps

---

_Keep this checklist in the repo for future releases._
