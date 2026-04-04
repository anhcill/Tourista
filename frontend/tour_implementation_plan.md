# Ke hoach chi tiet xay dung trang Tour du lich theo phong cach trang Hotel

## 1. Muc tieu

- Tao day du luong Tour gom: landing, search ket qua, chi tiet tour, dat tour, thanh toan thanh cong.
- Giu phong cach UI/UX dong nhat voi hotel (layout, card, sidebar bo loc, tinh toan gia, trang thai loading/error).
- Tai su dung toi da pattern ky thuat da co tu hotel de giam thoi gian va rui ro.
- Dam bao mobile first, toc do on dinh, de mo rong bo loc va sort sau nay.

## 2. Hien trang va ket luan

- Database da co schema tours, tour_images, tour_itinerary, tour_departures, booking_tour_details.
- Backend hien tai moi co day du cho hotel booking; chua co module tour controller/service/repository hoan chinh.
- Frontend da co route/link dieu huong den tours trong Header/Footer/SpecialOffers, nhung chua co app/tours va src/api/tourApi.js.
- constants da co endpoint TOURS (LIST, DETAIL, SEARCH, FEATURED), co the dung ngay.

Ket luan: Co the trien khai tour bang cach mirror 1-1 theo hotel flow, sau do bo sung logic dac thu tour (departure slots, so khach, difficulty, itinerary).

## 3. Pham vi chuc nang phien ban 1

- Trang landing tours: /tours
- Trang tim kiem tours: /tours/search
- Trang chi tiet tour: /tours/[id]
- Trang dat tour: /tours/[id]/book
- Hook booking chung /payments/success (tai su dung)

Ngoai pham vi V1:

- Ban do thuc su cho tour search (tam thoi placeholder giong hotel)
- Wishlist tour luu server
- Review/Comment tour
- Multi-currency va dynamic tax

## 4. Kien truc thong tin va luong nguoi dung

### Luong chinh

1. User vao /tours hoac click tour tu homepage.
2. User nhap destination, ngay khoi hanh, so nguoi lon, tre em.
3. He thong dieu huong den /tours/search?city=...&departureDate=...&adults=...&children=...
4. User loc/sort, chon tour card.
5. Vao /tours/[id], xem gallery + highlights + itinerary + departure slots.
6. Chon departure + so luong khach, bam Dat tour.
7. Vao /tours/[id]/book, xac nhan thong tin va thanh toan.
8. Chuyen sang /payments/success voi bookingCode.

### Mapping voi hotel

- hotel search page -> tours search page
- HotelCard -> TourCard
- hotel detail right booking widget -> tour detail right booking widget
- hotel booking page 2 cot -> tour booking page 2 cot

## 5. Ke hoach UI/UX chi tiet

### 5.1 Landing /tours

Muc tieu:

- Giong nhiep dieu trang hotels page, giu bo cuc section home dong nhat.
- Nhan manh tour-specific blocks.

Sections de xay:

1. Hero banner tours + form search nhanh (destination, departure date, adults, children).
2. Why choose our tours.
3. Featured tour categories.
4. Popular destinations.
5. Best-selling tours carousel.
6. Testimonials.
7. CTA cards.

Pattern style:

- Dung cung spacing token voi hotels (container max-width, card radius, shadow level).
- Mau chu dao dung blue family hien co de dong bo.

### 5.2 Search /tours/search

Layout:

- Banner tren + khu map placeholder.
- Main: trai la FilterSidebarTour, phai la list ket qua.
- Header ket qua co city + count + sort + list/map toggle.

Bo loc V1:

- Khoang gia moi nguoi
- So ngay (duration)
- Muc do kho (EASY/MEDIUM/HARD)
- Danh muc tour
- Rating
- Khoi hanh con cho (slot > 0)

Sort V1:

- Goi y tot nhat
- Gia thap den cao
- Danh gia cao nhat
- Khoi hanh gan nhat

Card Tour (TourCard):

- Anh cover
- Tieu de + dia diem
- Badge duration, difficulty
- Rating box
- Gia nguoi lon, gia tre em
- Urgency: con it cho
- CTA xem lich trinh/Dat ngay

States:

- Loading skeleton
- Empty state co CTA doi bo loc
- Error state co nut tai lai

### 5.3 Detail /tours/[id]

Layout:

- Gallery top (main + thumb) giong hotel.
- 2 cot: trai content tabs, phai booking widget sticky.

Tabs:

1. Tour Overview: mo ta, highlights, includes/excludes.
2. Itinerary: timeline ngay 1..n.
3. Price & Policy: bang gia, chinh sach huy.
4. FAQ / Luu y.

Right widget:

- Ten tour, city, rating.
- Chon departure date (dropdown/radio cards).
- Chon adults/children.
- Tong tien realtime = adults*priceAdult + children*priceChild.
- CTA Dat tour ngay.

### 5.4 Booking /tours/[id]/book

Layout 2 cot mirror hotel booking:

- Trai: tour summary, departure summary, cancellation policy, payment summary.
- Phai: thong tin nguoi dat + payment methods + dong y dieu khoan.

Validation:

- Bat buoc dang nhap.
- Bat buoc full name, email, phone.
- Bat buoc chon departure con slot.
- adults >= 1.
- children >= 0.

## 6. Ke hoach ky thuat Frontend

### 6.1 File structure de tao moi

Frontend app:

- app/tours/page.tsx
- app/tours/search/page.tsx
- app/tours/search/search.module.css
- app/tours/[id]/page.jsx
- app/tours/[id]/page.module.css
- app/tours/[id]/book/page.jsx
- app/tours/[id]/book/page.module.css

Frontend components:

- src/components/Tours/TourCard/TourCard.jsx
- src/components/Tours/TourCard/TourCard.module.css
- src/components/Tours/FilterSidebarTour/FilterSidebarTour.jsx
- src/components/Tours/FilterSidebarTour/FilterSidebarTour.module.css
- src/components/Tours/SearchResultsHeaderTour/SearchResultsHeaderTour.jsx
- src/components/Tours/SearchResultsHeaderTour/SearchResultsHeaderTour.module.css

Frontend API:

- src/api/tourApi.js

Tu chon (neu can quan ly state tap trung):

- src/store/slices/tourSlice.js

### 6.2 Data mapping standards

ApiTourSummary -> TourCardItem:

- id -> id
- title -> name
- city.nameVi/nameEn -> location
- coverImage -> image
- durationDays/durationNights -> durationLabel
- difficulty -> difficultyLabel
- avgRating -> rating
- reviewCount -> reviewCount
- pricePerAdult -> priceAdult
- pricePerChild -> priceChild
- nearestDeparture.availableSlots -> slots

Quy tac urgency:

- slots <= 5 => urgency hien mau do
- slots > 5 => khong urgency

### 6.3 Query params conventions

Search params V1:

- city
- departureDate
- adults
- children
- categoryId
- minPrice
- maxPrice
- durationMin
- durationMax
- difficulty
- sort

## 7. Ke hoach ky thuat Backend

### 7.1 API contracts de bo sung

Tour APIs:

1. GET /api/tours
2. GET /api/tours/featured
3. GET /api/tours/search
4. GET /api/tours/{id}

Booking tour:

5. POST /api/bookings/tours (hoac POST /api/bookings voi bookingType=TOUR)
6. GET /api/bookings/my co du lieu tour details

### 7.2 DTO de can

- TourSearchRequest
- TourSummaryResponse
- TourDetailResponse
- TourDepartureItem
- TourItineraryItem
- CreateTourBookingRequest
- CreateBookingResponse (tai su dung neu hop)

### 7.3 Rule nghiep vu can dong bo

- departureDate khong duoc nho hon ngay hien tai.
- availableSlots phai du cho tong so khach.
- totalAmount = adults*priceAdult + children*priceChild (+ tax neu co).
- Tao booking type TOUR trong bang bookings va insert booking_tour_details.
- Giam slot atomic khi dat thanh cong (transaction).

## 8. Lo trinh thuc thi de xuat (7 ngay)

Ngay 1:

- Finalize API spec cho tours + booking tours.
- Tao mock response format thong nhat FE/BE.

Ngay 2-3:

- Backend tours module (controller/service/repository/DTO).
- API search + detail + featured.

Ngay 4:

- Frontend tourApi + /tours/search + TourCard + FilterSidebarTour.

Ngay 5:

- /tours/[id] detail + booking widget + integration departure.

Ngay 6:

- /tours/[id]/book + connect create booking tour.
- Hook payments/success.

Ngay 7:

- E2E test, responsive polish, empty/error cases, fix bug.

## 9. Test plan chi tiet

### 9.1 Backend tests

- Search city hop le tra danh sach > 0.
- Search city khong co du lieu tra [] va 200.
- Detail id khong ton tai tra 404.
- Booking tour khi du slot tra 201 va booking code.
- Booking tour khi thieu slot tra 400.

### 9.2 Frontend tests

- Search khong city hien message hop le.
- Search thanh cong render card dung data API.
- Bo loc thay doi query va ket qua.
- Detail load dung itinerary + departures.
- Booking submit thanh cong dieu huong payments success.
- Booking fail hien toast loi dung.

### 9.3 Responsive checks

- 360px: sidebar thanh drawer/toggle, card xep doc.
- 768px: detail 1 cot, sticky card chuyen xuong duoi.
- > =1024px: layout 2 cot day du.

## 10. Tieu chi nghiem thu (Definition of Done)

- Co day du 4 trang tours: landing/search/detail/book.
- UI nhat quan voi phong cach hotel pages.
- Tat ca API tours ket noi that, khong con mock cung.
- Luong dat tour tao booking thanh cong va hien booking code.
- Khong loi console tren cac trang chinh.
- Dat muc responsive co ban mobile/tablet/desktop.

## 11. Rui ro va giai phap

Rui ro 1: API tour detail chua tra du itinerary/departure.

- Giai phap: de xuat schema response toi thieu ngay tu dau, lock contract bang example JSON.

Rui ro 2: Booking tour conflict slot khi nhieu user dat cung luc.

- Giai phap: transaction + pessimistic lock hoac update co dieu kien slots.

Rui ro 3: Duplicate UI logic giua hotel va tour gay kho maintain.

- Giai phap: trich xuat component chung (ResultHeader, StatusBox, PriceSummary) sau khi V1 on dinh.

## 12. Checklist bat dau ngay

- Tao src/api/tourApi.js.
- Tao app/tours/search/page.tsx tu skeleton hotels/search.
- Tao TourCard va FilterSidebarTour.
- Chay route /tours/search voi mock local truoc.
- Khi backend san sang thi switch sang API that.

## 13. Day 1 - Da hoan thanh

Da chot API spec va mock format FE/BE voi cac artifact:

- docs/tour_api_contract_day1.md
- docs/tour_api_openapi_day1.yaml
- docs/tour_day1_handoff.md
- mocks/tours/tours-search-success.json
- mocks/tours/tours-search-empty.json
- mocks/tours/tour-detail-success.json
- mocks/tours/tour-booking-create-success.json
- mocks/tours/tour-booking-validation-error.json
- mocks/tours/tour-booking-no-slot-error.json
- mocks/tours/requests/tour-search-query.example.txt
- mocks/tours/requests/tour-booking-create.request.json

Ket qua Day 1:

- Chot wrapper response va quy tac errors theo ApiResponse hien co.
- Chot endpoint booking tour rieng: POST /api/bookings/tours.
- Co bo mock du 3 nhom tinh huong: success, empty, validation/business error.

## 14. Day 3 - Da hoan thanh

Backend da bo sung booking tour va lich su booking mixed HOTEL/TOUR:

- Tao model + repository booking_tour_details.
- Mo endpoint POST /api/bookings/tours.
- Mo rong GET /api/bookings/my tra them bookingType va thong tin tour (tourId, tourTitle, departureId, departureDate).
- Giam slot khoi hanh theo co che atomic update (available_slots).

Artifact backend chinh:

- backend/src/main/java/vn/tourista/entity/BookingTourDetail.java
- backend/src/main/java/vn/tourista/repository/BookingTourDetailRepository.java
- backend/src/main/java/vn/tourista/repository/TourDepartureRepository.java
- backend/src/main/java/vn/tourista/dto/request/CreateTourBookingRequest.java
- backend/src/main/java/vn/tourista/dto/response/CreateTourBookingResponse.java
- backend/src/main/java/vn/tourista/controller/BookingController.java
- backend/src/main/java/vn/tourista/service/BookingService.java
- backend/src/main/java/vn/tourista/service/impl/BookingServiceImpl.java
- backend/src/main/java/vn/tourista/dto/response/MyBookingResponse.java

## 15. Day 4 - Da hoan thanh

Frontend da bo sung bo khung tim kiem tour ket noi API that:

- Tao api client cho tours.
- Tao route app/tours/search voi loading, error, empty state.
- Tao component TourCard.
- Tao component bo loc FilterSidebarTour.

Artifact frontend chinh:

- frontend/src/api/tourApi.js
- frontend/app/tours/search/page.tsx
- frontend/app/tours/search/search.module.css
- frontend/src/components/Tours/TourCard/TourCard.jsx
- frontend/src/components/Tours/TourCard/TourCard.module.css
- frontend/src/components/Tours/FilterSidebarTour/FilterSidebarTour.jsx
- frontend/src/components/Tours/FilterSidebarTour/FilterSidebarTour.module.css

## 16. Day 5 - Da hoan thanh

Frontend da bo sung trang chi tiet tour /tours/[id] theo layout 2 cot:

- Gallery tren dau trang.
- Tab content ben trai (Tong quan, Lich trinh, Gia & Chinh sach, Luu y).
- Booking widget sticky ben phai voi chon departure, chon so khach, tinh tong tien realtime.
- Nut Dat tour ngay dieu huong den /tours/[id]/book kem departureId/departureDate/adults/children.

Artifact frontend chinh:

- frontend/app/tours/[id]/page.jsx
- frontend/app/tours/[id]/page.module.css

## 17. Day 6 - Da hoan thanh

Frontend da bo sung trang dat tour /tours/[id]/book va ket noi API booking tour:

- Tao route booking tour voi layout 2 cot (tong quan + thong tin thanh toan).
- Tu dong dien thong tin nguoi dat tu profile dang nhap.
- Goi API POST /api/bookings/tours voi payload theo contract backend.
- Dieu huong sang /payments/success sau khi tao booking thanh cong.

Artifact frontend chinh:

- frontend/app/tours/[id]/book/page.jsx
- frontend/app/tours/[id]/book/page.module.css
- frontend/src/api/bookingApi.js
- frontend/src/utils/constants.js

## 18. Day 7 - Da hoan thanh

Hoan thien luong end-to-end va polish UX cho booking tour:

- Nang cap trang lich su booking de hien thi mixed HOTEL/TOUR dua tren bookingType.
- Bo sung thong tin TOUR trong card (tourTitle, departureDate, departureId, so khach).
- Cap nhat payment success de dieu huong theo ngữ cảnh booking (tour/hotel).
- Truyen them bookingType va tourId tu luong dat tour sang payment success.

Artifact frontend chinh:

- frontend/app/profile/bookings/page.jsx
- frontend/app/profile/bookings/page.module.css
- frontend/app/payments/success/page.jsx
- frontend/app/tours/[id]/book/page.jsx
