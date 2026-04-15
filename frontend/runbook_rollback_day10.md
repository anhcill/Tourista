# Day 10: Rollback & Runbook (Tourista)

## Rollback Steps
1. Restore previous backend and frontend builds:
   - Backend: Redeploy previous JAR/WAR or restore previous Docker image.
   - Frontend: Restore previous build folder or static files.
2. Restore database from backup (if schema/data changed):
   - Use backup taken before migration.
3. Revert configuration changes (API URLs, secrets, etc).
4. Notify team and users if downtime is expected.

## Hotfix/Recovery
- For critical bugs, patch only the affected module and redeploy.
- For frontend-only issues, redeploy previous frontend build.
- For backend-only issues, redeploy previous backend build.

## Monitoring
- Watch logs for errors after rollback.
- Confirm main flows (see smoke script) are restored.

---

_Keep this runbook updated for future releases._
