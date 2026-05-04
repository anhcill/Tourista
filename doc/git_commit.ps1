git add frontend/src/api/pricingApi.js
git add doc/git_commit.ps1 doc/check_chatbot.js

$msg = @"
fix: pricingApi URL endpoints mismatch with backend controller

Frontend was calling /pricing/calculate/{id}/per-night but
backend expects /api/pricing/calculate/hotel/{id}/per-night.
Fixed all 3 methods in pricingApi.js to use correct path segments.
"@

git commit -m $msg
git push origin main
git status
