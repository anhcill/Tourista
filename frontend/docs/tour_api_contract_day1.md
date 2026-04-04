# Tour API Contract - Day 1 Finalized

## 1) Muc tieu

Tai lieu nay chot contract giua FE va BE cho luong Tour V1, de team co the code song song tu Day 2.

- Dung chung wrapper `ApiResponse<T>` nhu backend hien tai.
- Endpoint prefix: `/api` (frontend da cau hinh `NEXT_PUBLIC_API_URL=http://localhost:8080/api`).
- Date format: `yyyy-MM-dd`.
- Currency: `VND`.

## 2) Response wrapper chung

Tat ca endpoint thanh cong/that bai tuan theo schema:

```json
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": null,
  "timestamp": "2026-03-28T11:20:30"
}
```

- `errors` chi co khi validate fail.
- FE (`axiosClient`) dang tra ve body da unwrap theo `response.data` HTTP.

## 3) Endpoints tours

### 3.1 GET /api/tours

Muc dich:

- Lay danh sach tours active (landing, fallback list).

Query params:

- `limit` (optional, int, default 20, max 100)

`data` item schema (`TourSummaryResponse`):

- `id`: number
- `title`: string
- `slug`: string
- `city`: string
- `categoryName`: string
- `durationDays`: number
- `durationNights`: number
- `difficulty`: `EASY|MEDIUM|HARD`
- `avgRating`: number
- `reviewCount`: number
- `coverImage`: string|null
- `pricePerAdult`: number
- `pricePerChild`: number
- `nearestDepartureDate`: string|null (`yyyy-MM-dd`)
- `availableSlots`: number

### 3.2 GET /api/tours/featured

Muc dich:

- Lay tours noi bat cho home/landing.

Query params:

- `limit` (optional, int, default 6, max 20)

Response schema giong `GET /api/tours`.

### 3.3 GET /api/tours/search

Muc dich:

- Tim tours theo city + departure + bo loc.

Query params (V1):

- `city` (required, string)
- `departureDate` (optional, date)
- `adults` (optional, int, default 1)
- `children` (optional, int, default 0)
- `categoryId` (optional, int)
- `minPrice` (optional, number)
- `maxPrice` (optional, number)
- `durationMin` (optional, int)
- `durationMax` (optional, int)
- `difficulty` (optional, `EASY|MEDIUM|HARD`)
- `minRating` (optional, number)
- `sort` (optional, enum):
  - `RECOMMENDED`
  - `PRICE_ASC`
  - `RATING_DESC`
  - `DEPARTURE_ASC`

Response `data` la array `TourSummaryResponse`.

### 3.4 GET /api/tours/{id}

Muc dich:

- Lay chi tiet 1 tour cho trang detail va booking.

Path params:

- `id` (required, long)

`data` schema (`TourDetailResponse`):

- `id`: number
- `title`: string
- `slug`: string
- `city`: string
- `categoryName`: string
- `description`: string
- `highlights`: string[]
- `includes`: string[]
- `excludes`: string[]
- `durationDays`: number
- `durationNights`: number
- `difficulty`: `EASY|MEDIUM|HARD`
- `maxGroupSize`: number
- `minGroupSize`: number
- `avgRating`: number
- `reviewCount`: number
- `coverImage`: string|null
- `images`: string[]
- `pricePerAdult`: number
- `pricePerChild`: number
- `itinerary`: array of:
  - `dayNumber`: number
  - `title`: string
  - `description`: string
- `departures`: array of:
  - `departureId`: number
  - `departureDate`: string (`yyyy-MM-dd`)
  - `availableSlots`: number
  - `priceOverride`: number|null

## 4) Booking tour API

### 4.1 POST /api/bookings/tours

Muc dich:

- Tao booking cho tour.

Auth:

- Required (Bearer token).

Request body (`CreateTourBookingRequest`):

```json
{
  "tourId": 2001,
  "departureId": 91001,
  "adults": 2,
  "children": 1,
  "guestName": "Nguyen Van A",
  "guestEmail": "a@example.com",
  "guestPhone": "0909123456",
  "specialRequests": "Can ghe em be"
}
```

Rules V1:

- `adults >= 1`
- `children >= 0`
- `departure` phai con du slot cho `adults + children`.
- Tong tien:
  - `subtotal = adults * pricePerAdult + children * pricePerChild`
  - `discountAmount = 0` (V1)
  - `taxAmount = 0` (V1)
  - `totalAmount = subtotal`

Response `data` (`CreateTourBookingResponse`):

- `bookingId`: number
- `bookingCode`: string
- `status`: `PENDING|CONFIRMED|...`
- `totalAmount`: number
- `currency`: `VND`
- `tourId`: number
- `tourTitle`: string
- `departureId`: number
- `departureDate`: string (`yyyy-MM-dd`)
- `adults`: number
- `children`: number
- `createdAt`: datetime

### 4.2 GET /api/bookings/my

Muc dich:

- Lay lich su booking (gom HOTEL + TOUR).

Rule FE:

- FE phan nhanh theo `bookingType` de render card khac nhau.

`data` item minimum can co:

- `bookingId`
- `bookingCode`
- `bookingType` (`HOTEL|TOUR`)
- `status`
- `totalAmount`
- `currency`
- `createdAt`
- Tour fields (nullable voi HOTEL):
  - `tourId`
  - `tourTitle`
  - `departureId`
  - `departureDate`
  - `adults`
  - `children`

## 5) Error contract

### 5.1 Validation error (400)

```json
{
  "success": false,
  "message": "Du lieu khong hop le",
  "errors": {
    "city": "Thanh pho la bat buoc",
    "adults": "So nguoi lon phai >= 1"
  },
  "timestamp": "2026-03-28T11:20:30"
}
```

### 5.2 Business error (400)

```json
{
  "success": false,
  "message": "Khong du cho trong lich khoi hanh da chon",
  "timestamp": "2026-03-28T11:20:30"
}
```

### 5.3 Not found (404)

```json
{
  "success": false,
  "message": "Khong tim thay tour",
  "timestamp": "2026-03-28T11:20:30"
}
```

## 6) Frontend mapping quick notes

- `difficulty` map label:
  - `EASY -> De`
  - `MEDIUM -> Trung binh`
  - `HARD -> Thu thach`
- Neu `priceOverride` ton tai tai departure duoc chon, uu tien dung `priceOverride` de tinh tien.
- Urgency rule:
  - `availableSlots <= 5` hien canh bao.

## 7) Locked decisions (Day 1)

- Chot su dung endpoint rieng: `POST /api/bookings/tours` de tranh va cham voi payload hotel hien tai.
- Chot wrappers va date format giong he thong dang co.
- Chot search params V1 nhu muc 3.3.
