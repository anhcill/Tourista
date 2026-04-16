# Auth Hardening Plan - HttpOnly Cookie Migration (Day 2)

## Muc tieu

- Loai bo phu thuoc vao token trong JavaScript storage.
- Chuyen sang mo hinh Access/Refresh token qua HttpOnly cookie.
- Giam rui ro token bi danh cap khi co XSS.

## Hien trang

- Da harden buoc 1: token duoc luu theo sessionStorage + migrate tu localStorage cu.
- Axios, auth slice, websocket, header, bot widget da dung chung authStorage helper.

## Ke hoach migration 2 giai doan

### Giai doan A (tuong thich nguoc)

1. Backend

- Login/refresh set cookie HttpOnly + Secure + SameSite.
- Bo sung endpoint logout xoa cookie server-side.
- Cho phep song song:
  - Header Authorization (legacy)
  - Cookie auth (moi)

2. Frontend

- Bat `withCredentials` cho axios.
- Them feature flag auth mode:
  - `legacy-header`
  - `cookie-http-only`
- O mode cookie:
  - Khong doc/ghi access token trong storage.
  - Interceptor refresh dua vao cookie, khong gui refresh token trong body.

3. QA

- E2E cho login, refresh, logout, het han phien.
- Kiem tra CORS + credentials tren moi env.

### Giai doan B (cat bo legacy)

1. Backend

- Tat duong Authorization header cho auth token nguoi dung cuoi (neu khong can).
- Ap dung rotate refresh token bat buoc.

2. Frontend

- Xoa hoan toan logic luu token client-side.
- Chi giu thong tin user profile khong nhay cam (neu can).

## Tieu chi hoan tat

- Token khong con ton tai trong localStorage/sessionStorage.
- Dang nhap, refresh, logout hoat dong day du qua cookie.
- E2E pass tren cookie mode.
- Khong phat sinh 401 dot ngot sau khi refresh page.
