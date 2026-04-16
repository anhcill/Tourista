# Deploy Production Guide Day 10

This guide deploys the release snapshot:
- Branch: release/2026-04-15-production
- Tag: v0.1.0-day10

## 1. Pre-deploy checklist
1. Confirm you are deploying the release branch or tag only.
2. Confirm DB backup can be restored.
3. Confirm all production env values are ready.
4. Confirm payment and OAuth callback URLs are production URLs.

## 2. Database backup
Example command:
mysqldump -u <db_user> -p <db_name> > backup_before_day10.sql

## 3. Backend deploy
### 3.1 Required env
Use backend/.env.example as source of truth.
Required values:
- DB_URL
- DB_USERNAME
- DB_PASSWORD
- JWT_SECRET
- MAIL_USERNAME
- MAIL_PASSWORD
- FRONTEND_URL
- APP_CORS_ALLOWED_ORIGINS
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- VNPAY_TMN_CODE
- VNPAY_HASH_SECRET
- VNPAY_RETURN_URL
- GEMINI_API_KEY

Railway note:
- Do not use mysql://... directly for Spring Boot datasource url.
- Convert to jdbc:mysql://... format, or rely on Railway MYSQLHOST/MYSQLPORT/MYSQLDATABASE/MYSQLUSER/MYSQLPASSWORD variables.

Example (from Railway public endpoint):
- Input URI: mysql://root:<password>@maglev.proxy.rlwy.net:44405/railway
- Spring env:
	- DB_URL=jdbc:mysql://maglev.proxy.rlwy.net:44405/railway?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true
	- DB_USERNAME=root
	- DB_PASSWORD=<password>

### 3.2 Build
From backend folder:
- mvnw clean package

### 3.3 Run
- java -jar target/backend-1.0.0.jar

Health check:
- Verify API responds from production URL
- Verify auth refresh endpoint works

## 4. Frontend deploy
### 4.1 Env file
Create frontend/.env.production with:
NEXT_PUBLIC_API_URL=https://<your-production-api>/api

### 4.2 Build and run
From frontend folder:
- npm ci
- npm run build
- npm run start

## 5. Post-deploy smoke test
Use frontend/smoke_script_day10.md and execute all checks:
- User login, booking, payment, profile, favorites
- Admin login and dashboard checks

## 6. Rollback
Follow frontend/runbook_rollback_day10.md

Fast rollback sequence:
1. Redeploy previous backend artifact
2. Redeploy previous frontend build
3. Restore DB backup only if needed
4. Run smoke checks

## 7. Production hardening notes
- Keep frontend and backend logs enabled.
- Monitor 4xx and 5xx spikes in first 30 minutes.
- Freeze new feature deploys until smoke checks are green.
