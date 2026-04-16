# Viec Can Lam Theo Ngay - Day 10 (Tourista)

Muc tieu: het loi backend, build xanh, sau do day nhanh cac muc tang conversion.

## Day 0 - Xu ly loi backend ngay (hom nay)

- [x] Fix DB credential de app boot duoc
  - Loi gap: Access denied for user 'ducan'@'localhost' (using password: NO)
  - Trang thai: da patch fallback username local trong backend
  - File da sua: ../backend/src/main/resources/application.yml
  - Viec can lam tren may:
    - Tao file ../backend/.env tu ../backend/.env.example
    - Dat dung 3 bien: DB_URL, DB_USERNAME, DB_PASSWORD

- [x] Kiem tra ket noi DB
  - Chay trong backend:
    - mvnw test
  - Neu van loi:
    - Kiem tra user MySQL co ton tai va co password
    - Kiem tra quyen tren schema tourista

- [x] Xac nhan app start duoc
  - Chay trong backend:
    - mvnw spring-boot:run
  - Tieu chi xong: khong con BeanCreationException lien quan entityManagerFactory/dataSource

## Day 1 - On dinh release gate (P0)

- [x] Sua loi TypeScript fail build frontend
  - File: app/hotels/search/page.tsx
  - Muc tieu: khong con xung dot type filters/never[]

- [x] Chay lai bo gate bat buoc
  - Frontend:
    - npm run lint
    - npm run build
    - npm run e2e
  - Backend:
    - mvnw test

- [x] Tick lai cac muc da pass
  - File: release_checklist_day10.md

## Day 2 - Bao mat va do tin cay

- [x] Giam rui ro token localStorage
  - Files:
    - src/store/slices/authSlice.js
    - src/api/axiosClient.js
  - Muc tieu: co plan chuyen sang cookie HttpOnly cho token nhay cam
  - Da bo sung plan: docs/auth_hardening_http_only_plan_day2.md

- [x] Chan nguy co XSS tren bai viet
  - File: app/articles/[slug]/page.jsx
  - Muc tieu: sanitize noi dung truoc render HTML

- [x] Don dep mock con sot trong flow that
  - Files:
    - app/hotels/search/page.tsx
    - src/api/adminApi.js

## Day 3 - SEO + Error handling + QA

- [x] Hoan thien SEO app router
  - Them metadata theo trang quan trong
  - Them robots + sitemap

- [x] Them trang fallback loi
  - Them not-found/error/global-error

- [x] Mo rong E2E len >= 10 test critical
  - Them payment fail/cancel
  - Them refresh token het han
  - Them route guard user/admin

## Day 4-7 - Dot pha tang chuyen doi

- [x] Price Alert + Abandon Booking Recovery
- [x] AI Trip Concierge ca nhan hoa
- [x] UGC review co anh/video + xac thuc da di
- [ ] Cum landing SEO theo city/theme/season

## Dinh nghia Done cho dot release nay

- [x] Backend start on dinh, ket noi DB thanh cong
- [x] Frontend build xanh
- [x] Backend test xanh
- [x] E2E critical xanh
- [ ] Smoke script day10 duoc tick day du
