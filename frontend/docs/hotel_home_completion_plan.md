# Ke hoach hoan thien trang chu Khach san (Hotel Homepage)

## 1) Muc tieu

- Hoan thien trang chu khach san theo dung muc dich kinh doanh: nhieu section dang la mock se duoc thay bang data that + dieu huong dung.
- Giu nguyen visual language hien co, uu tien nang cap chat luong data/flow truoc, toi uu UI sau.
- Co checklist nghiem thu ro rang de tranh tinh trang "bam vao khong co gi".

## 2) Ket qua kiem tra hien tai (thuc te code)

Trang tong:
- `frontend/app/hotels/page.tsx`: da co bo cuc section day du, nhung chat luong data giua cac section chua dong deu.

Section dang ket noi API that:
- Hero search: `frontend/src/components/Home/HeroBanner.jsx` (dieu huong den `/hotels/search`).
- Special Offers (HOTEL): `frontend/src/components/Home/SpecialOffers/SpecialOffers.jsx` dang goi `/api/hotels/featured` va `/api/hotels/trending`.

Section dang mock/hardcode (chua ket noi backend):
- `frontend/src/components/Home/ExclusiveHotelSearch/ExclusiveHotelSearch.jsx`
- `frontend/src/components/Home/TrendingDestinations/TrendingDestinations.jsx`
- `frontend/src/components/Home/SpecialOfferCategories/SpecialOfferCategories.jsx`
- `frontend/src/components/Home/MakeAComparison/MakeAComparison.jsx`
- `frontend/src/components/Home/Testimonials/Testimonials.jsx`
- `frontend/src/components/Home/CTACards/CTACards.jsx`
- `frontend/src/components/Home/WhyChooseUs/WhyChooseUs.jsx` (content tinh, khong loi nhung chua CMS/API-driven)

Backend API dang co san (co the tai su dung ngay):
- Hotels: `/api/hotels`, `/api/hotels/featured`, `/api/hotels/trending`, `/api/hotels/search`, `/api/hotels/{id}`
- Tours: `/api/tours`, `/api/tours/featured`, `/api/tours/search`, `/api/tours/{id}`

API con thieu cho homepage hotel (neu muon bo mock hoan toan):
- API thong ke destination trending theo city/country + hotel_count + avg_price.
- API special offer categories (promotion groups) cho section category.
- API testimonial/review feed cho homepage.
- API content blocks (cta/newsletter/why-us) neu muon quan ly dong.

## 3) Van de uu tien cao can xu ly ngay

1. Nhieu section dang dung du lieu mock nen nguoi dung thay noi dung dep nhung "khong song".
2. Nut CTA trong cac block mock chua map den flow kinh doanh ro rang.
3. Khong co fallback phan cap cho tung section (co section loading, co section khong).
4. Khong co do luong click/CTR de biet section nao hieu qua.

## 4) Ke hoach trien khai theo phase

### Phase A - Quick Win (1-2 ngay)

Muc tieu: giam ngay phan "chua lam" ma khong doi backend nhieu.

Cong viec:
1. Hook section "TrendingDestinations" sang data that tam thoi bang cach dung `/api/hotels/trending` va map ve city cards.
2. Hook section "SpecialOfferCategories" sang data that tam thoi bang `/api/hotels/featured` (group gia lap theo star/rating/price bands).
3. Chuan hoa tat ca CTA:
- "Xem ngay", "Kham pha", "Dat ngay" => route hop le (`/hotels/search`, `/hotels/{id}`, `/tours`).
4. Them state thong nhat cho tung section:
- Loading skeleton
- Empty message + CTA thay the
- Error + retry

Deliverables:
- homepage khong con section "treo" khi data rong
- tat ca nut tren section deu co hanh vi ro rang

### Phase B - Data Truely Dynamic (3-5 ngay)

Muc tieu: bo mock o cac block business-critical.

Cong viec Frontend:
1. Tao API clients moi:
- `src/api/homeApi.js` (neu muon tap trung)
2. Refactor sections de nhan data tu props/API:
- TrendingDestinations
- SpecialOfferCategories
- Testimonials
- MakeAComparison

Cong viec Backend:
1. Them endpoint homepage:
- `GET /api/home/hotels/trending-destinations`
- `GET /api/home/hotels/offer-categories`
- `GET /api/home/testimonials`
2. Co cache co ban cho endpoint homepage (TTL 5-15 phut).

Deliverables:
- 4 section lon bo mock hoan toan
- thoi gian tai trang on dinh nho cache

### Phase C - Product Quality & Conversion (2-3 ngay)

Muc tieu: tang chat luong su dung va conversion.

Cong viec:
1. Them tracking event:
- click cta theo section
- click card item
- submit hero search
2. A/B copy ngan cho Hero + CTA.
3. Toi uu responsive:
- mobile first cho section card lon (deal/trending/testimonial)
4. Accessibility:
- keyboard nav cho card/button
- aria label cho icon-only controls

Deliverables:
- Co dashboard event toi thieu
- Co bao cao CTR theo section

## 5) Backlog chi tiet theo component

1. `HeroBanner.jsx`
- Giu lai flow search hien tai.
- Can bo sung validate input destination de tranh query rong.

2. `SpecialOffers.jsx`
- Hien chi co HOTEL; tab TOUR dang empty by design.
- Neu muon day du, map tab TOUR sang `/api/tours/featured`.

3. `ExclusiveHotelSearch.jsx`
- Chuyen map pins tu mock thanh danh sach destination tu API.
- Tab states hien tai chi doi mau, chua doi data.

4. `TrendingDestinations.jsx`
- Bo du lieu mock 12 city.
- Lay dynamic city cards tu backend.

5. `SpecialOfferCategories.jsx`
- Replace OFFERS hardcode bang category feed.

6. `MakeAComparison.jsx`
- Replace COMPARISONS hardcode bang data thong ke thuc te.

7. `Testimonials.jsx`
- Replace REVIEWS mock bang review feed da duyet.

8. `CTACards.jsx`
- map action that:
  - dang ky newsletter (submit)
  - viet danh gia (route form)
  - kham pha tin tuc (route blog/news)

## 6) API Contract de xay them (de xuat)

### GET /api/home/hotels/trending-destinations
Response item:
- cityId
- cityName
- countryName
- countryFlag
- hotelCount
- avgPricePerNight
- avgRating
- coverImage

### GET /api/home/hotels/offer-categories
Response item:
- categoryKey
- title
- subtitle
- discountLabel
- coverImage
- targetUrl

### GET /api/home/testimonials
Response item:
- id
- content
- rating
- authorName
- authorAvatar
- country
- verified
- targetName

## 7) Definition of Done

1. Khong con du lieu mock trong cac section business-critical (trending, category, testimonial, comparison).
2. Tat ca CTA o trang chu co route hoat dong va co theo doi su kien click.
3. Moi section deu co loading/empty/error state.
4. Lighthouse mobile >= 75 (Performance), >= 90 (Accessibility).
5. QA pass luong: Hero search -> search result -> hotel detail -> booking.

## 8) Thu tu thuc hien de xuat

1. Phase A (quick win)
2. Bo sung API backend cho homepage
3. Phase B ket noi dynamic data
4. Phase C toi uu conversion + theo doi

## 9) Uoc tinh tong

- Frontend quick win: 1-2 ngay
- Backend API homepage + integration: 3-5 ngay
- Polish + analytics: 2-3 ngay
- Tong: 6-10 ngay lam viec
