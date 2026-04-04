# 🌍 TOURISTA - Frontend Documentation

## 📋 Tổng Quan Dự Án

**Tourista** là nền tảng đặt phòng khách sạn và tour du lịch trực tuyến, cung cấp trải nghiệm tìm kiếm, đặt phòng và thanh toán liền mạch cho người dùng.

### 🎯 Mục Tiêu Chính
- Tìm kiếm và đặt phòng khách sạn
- Đặt tour du lịch
- Quản lý đặt phòng và lịch sử
- Đánh giá và review
- Thanh toán trực tuyến an toàn

---

## 🏗️ Cấu Trúc Dự Án

```
frontend/
│
├── public/                          # Tài nguyên tĩnh
│   ├── index.html                   # HTML template chính
│   ├── favicon.ico                  # Icon website
│   └── assets/                      # Hình ảnh, fonts tĩnh
│       ├── images/
│       └── fonts/
│
├── src/                             # Source code chính
│   │
│   ├── api/                         # API Integration Layer
│   │   ├── axiosClient.js           # Cấu hình Axios (base URL, interceptors)
│   │   ├── authApi.js               # API xác thực (login, register, logout)
│   │   ├── hotelApi.js              # API khách sạn (search, detail, list)
│   │   ├── tourApi.js               # ⚠️ CẦN THÊM: API tour du lịch
│   │   ├── bookingApi.js            # API đặt phòng (create, update, cancel)
│   │   ├── reviewApi.js             # API đánh giá (get, post, update)
│   │   ├── paymentApi.js            # ⚠️ CẦN THÊM: API thanh toán
│   │   └── userApi.js               # ⚠️ CẦN THÊM: API quản lý user profile
│   │
│   ├── components/                  # Reusable Components
│   │   │
│   │   ├── Layout/                  # Layout Components
│   │   │   ├── Header/
│   │   │   │   ├── Header.jsx       # Header chính (logo, menu, user menu)
│   │   │   │   ├── Header.module.css
│   │   │   │   └── Navigation.jsx   # Menu điều hướng
│   │   │   │
│   │   │   ├── Footer/
│   │   │   │   ├── Footer.jsx       # Footer (links, contact, social)
│   │   │   │   └── Footer.module.css
│   │   │   │
│   │   │   └── Sidebar/             # ⚠️ CẦN THÊM: Sidebar filter
│   │   │       ├── Sidebar.jsx
│   │   │       └── Sidebar.module.css
│   │   │
│   │   ├── Search/                  # Search Components
│   │   │   ├── SearchBar/
│   │   │   │   ├── SearchBar.jsx    # Thanh tìm kiếm chính (location, date, guests)
│   │   │   │   └── SearchBar.module.css
│   │   │   │
│   │   │   ├── SearchFilter/        # ⚠️ CẦN THÊM: Bộ lọc tìm kiếm
│   │   │   │   ├── SearchFilter.jsx # (price range, rating, amenities)
│   │   │   │   └── SearchFilter.module.css
│   │   │   │
│   │   │   └── DateRangePicker/     # ⚠️ CẦN THÊM: Chọn ngày check-in/out
│   │   │       ├── DateRangePicker.jsx
│   │   │       └── DateRangePicker.module.css
│   │   │
│   │   ├── Cards/                   # Card Components
│   │   │   ├── HotelCard/
│   │   │   │   ├── HotelCard.jsx    # Card hiển thị khách sạn (image, name, price, rating)
│   │   │   │   └── HotelCard.module.css
│   │   │   │
│   │   │   ├── TourCard/
│   │   │   │   ├── TourCard.jsx     # Card hiển thị tour
│   │   │   │   └── TourCard.module.css
│   │   │   │
│   │   │   ├── ReviewCard/
│   │   │   │   ├── ReviewCard.jsx   # Card đánh giá của user
│   │   │   │   └── ReviewCard.module.css
│   │   │   │
│   │   │   └── OfferCard/           # ⚠️ CẦN THÊM: Card ưu đãi đặc biệt
│   │   │       ├── OfferCard.jsx
│   │   │       └── OfferCard.module.css
│   │   │
│   │   ├── Common/                  # ⚠️ CẦN THÊM: Common UI Components
│   │   │   ├── Button/
│   │   │   │   ├── Button.jsx       # Button tái sử dụng (primary, secondary, outline)
│   │   │   │   └── Button.module.css
│   │   │   │
│   │   │   ├── Input/
│   │   │   │   ├── Input.jsx        # Input field
│   │   │   │   └── Input.module.css
│   │   │   │
│   │   │   ├── Modal/
│   │   │   │   ├── Modal.jsx        # Modal popup
│   │   │   │   └── Modal.module.css
│   │   │   │
│   │   │   ├── Loading/
│   │   │   │   ├── Loading.jsx      # Loading spinner/skeleton
│   │   │   │   └── Loading.module.css
│   │   │   │
│   │   │   ├── Rating/
│   │   │   │   ├── Rating.jsx       # Component hiển thị rating (stars)
│   │   │   │   └── Rating.module.css
│   │   │   │
│   │   │   ├── Pagination/
│   │   │   │   ├── Pagination.jsx   # Phân trang
│   │   │   │   └── Pagination.module.css
│   │   │   │
│   │   │   └── Toast/
│   │   │       ├── Toast.jsx        # Thông báo (success, error, warning)
│   │   │       └── Toast.module.css
│   │   │
│   │   ├── ImageGallery/            # ⚠️ CẦN THÊM: Gallery ảnh khách sạn
│   │   │   ├── ImageGallery.jsx
│   │   │   └── ImageGallery.module.css
│   │   │
│   │   └── Map/                     # ⚠️ CẦN THÊM: Bản đồ (Google Maps/Leaflet)
│   │       ├── Map.jsx
│   │       └── Map.module.css
│   │
│   ├── pages/                       # Page Components
│   │   │
│   │   ├── Home/
│   │   │   ├── Home.jsx             # Trang chủ (hero, search, special offers, trending)
│   │   │   ├── Home.module.css
│   │   │   └── components/          # Components riêng cho Home
│   │   │       ├── HeroSection.jsx  # Banner chính "Discover Your Trip Worldwide"
│   │   │       ├── SpecialOffers.jsx # Section "Special Offers"
│   │   │       ├── TrendingDestinations.jsx # "Explore Stays in Trending Destinations"
│   │   │       └── HighestReviewed.jsx # "Compare The Highest Reviewed Post Offers"
│   │   │
│   │   ├── SearchResult/
│   │   │   ├── SearchResult.jsx     # Trang kết quả tìm kiếm (list hotels/tours)
│   │   │   ├── SearchResult.module.css
│   │   │   └── components/
│   │   │       ├── ResultList.jsx   # Danh sách kết quả
│   │   │       └── ResultMap.jsx    # Bản đồ kết quả
│   │   │
│   │   ├── HotelDetail/
│   │   │   ├── HotelDetail.jsx      # Chi tiết khách sạn (gallery, info, amenities, reviews)
│   │   │   ├── HotelDetail.module.css
│   │   │   └── components/
│   │   │       ├── HotelInfo.jsx    # Thông tin cơ bản
│   │   │       ├── Amenities.jsx    # Tiện nghi
│   │   │       ├── RoomList.jsx     # Danh sách phòng
│   │   │       ├── ReviewSection.jsx # Phần đánh giá
│   │   │       └── BookingWidget.jsx # Widget đặt phòng (sticky)
│   │   │
│   │   ├── TourDetail/              # ⚠️ CẦN THÊM: Chi tiết tour
│   │   │   ├── TourDetail.jsx
│   │   │   └── TourDetail.module.css
│   │   │
│   │   ├── Booking/
│   │   │   ├── Booking.jsx          # Trang đặt phòng (form thông tin, summary)
│   │   │   ├── Booking.module.css
│   │   │   └── components/
│   │   │       ├── BookingForm.jsx  # Form nhập thông tin
│   │   │       ├── BookingSummary.jsx # Tóm tắt đặt phòng
│   │   │       └── GuestInfo.jsx    # Thông tin khách
│   │   │
│   │   ├── Payment/
│   │   │   ├── Payment.jsx          # Trang thanh toán (payment methods, confirm)
│   │   │   ├── Payment.module.css
│   │   │   └── components/
│   │   │       ├── PaymentMethod.jsx # Chọn phương thức thanh toán
│   │   │       ├── PaymentForm.jsx  # Form thanh toán
│   │   │       └── OrderSummary.jsx # Tóm tắt đơn hàng
│   │   │
│   │   ├── Auth/                    # Authentication Pages
│   │   │   ├── Login/
│   │   │   │   ├── Login.jsx        # Trang đăng nhập
│   │   │   │   └── Login.module.css
│   │   │   │
│   │   │   ├── Register/
│   │   │   │   ├── Register.jsx     # Trang đăng ký
│   │   │   │   └── Register.module.css
│   │   │   │
│   │   │   └── ForgotPassword/      # ⚠️ CẦN THÊM: Quên mật khẩu
│   │   │       ├── ForgotPassword.jsx
│   │   │       └── ForgotPassword.module.css
│   │   │
│   │   ├── Profile/                 # ⚠️ CẦN THÊM: User Profile
│   │   │   ├── Profile.jsx          # Trang profile (info, bookings, reviews)
│   │   │   ├── Profile.module.css
│   │   │   └── components/
│   │   │       ├── ProfileInfo.jsx  # Thông tin cá nhân
│   │   │       ├── BookingHistory.jsx # Lịch sử đặt phòng
│   │   │       ├── MyReviews.jsx    # Đánh giá của tôi
│   │   │       └── Favorites.jsx    # Yêu thích
│   │   │
│   │   └── NotFound/                # ⚠️ CẦN THÊM: 404 Page
│   │       ├── NotFound.jsx
│   │       └── NotFound.module.css
│   │
│   ├── routes/
│   │   └── AppRoutes.jsx            # Định nghĩa routes (React Router)
│   │
│   ├── store/                       # State Management (Redux Toolkit)
│   │   ├── store.js                 # ⚠️ CẦN THÊM: Redux store configuration
│   │   │
│   │   ├── slices/
│   │   │   ├── authSlice.js         # State: user, token, isAuthenticated
│   │   │   ├── bookingSlice.js      # State: current booking, booking list
│   │   │   ├── hotelSlice.js        # ⚠️ CẦN THÊM: State hotels, filters
│   │   │   ├── searchSlice.js       # ⚠️ CẦN THÊM: State search params
│   │   │   └── uiSlice.js           # ⚠️ CẦN THÊM: State UI (loading, toast, modal)
│   │   │
│   │   └── hooks/                   # ⚠️ CẦN THÊM: Custom Redux hooks
│   │       └── useAppDispatch.js
│   │
│   ├── hooks/                       # ⚠️ CẦN THÊM: Custom React Hooks
│   │   ├── useAuth.js               # Hook xác thực
│   │   ├── useDebounce.js           # Hook debounce cho search
│   │   ├── useLocalStorage.js       # Hook localStorage
│   │   └── useWindowSize.js         # Hook responsive
│   │
│   ├── utils/                       # Utility Functions
│   │   ├── formatDate.js            # Format ngày tháng
│   │   ├── formatCurrency.js        # ⚠️ CẦN THÊM: Format tiền tệ
│   │   ├── validation.js            # ⚠️ CẦN THÊM: Validation helpers
│   │   ├── constants.js             # ⚠️ CẦN THÊM: Constants (API URLs, configs)
│   │   └── helpers.js               # ⚠️ CẦN THÊM: Helper functions
│   │
│   ├── styles/                      # ⚠️ CẦN THÊM: Global Styles
│   │   ├── global.css               # Global CSS
│   │   ├── variables.css            # CSS variables (colors, spacing, fonts)
│   │   └── reset.css                # CSS reset
│   │
│   ├── contexts/                    # ⚠️ CẦN THÊM: React Contexts (nếu không dùng Redux)
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   │
│   ├── App.jsx                      # Component App chính
│   ├── App.css                      # Styles cho App
│   └── index.js                     # Entry point
│
├── .env.example                     # ⚠️ CẦN THÊM: Environment variables template
├── .gitignore                       # Git ignore
├── package.json                     # Dependencies
├── README.md                        # Documentation (file này)
└── vite.config.js / webpack.config.js # Build configuration
```

---

## 🔧 Công Nghệ Sử Dụng

### Core
- **React 18+** - UI Library
- **React Router v6** - Routing
- **Axios** - HTTP Client

### State Management
- **Redux Toolkit** - Global state management
- **React Query** (Optional) - Server state management, caching

### Styling
- **CSS Modules** - Component-scoped CSS
- **Styled Components** (Optional) - CSS-in-JS
- Hoặc **Tailwind CSS** (Optional) - Utility-first CSS

### Form Handling
- **React Hook Form** - Form validation
- **Yup** hoặc **Zod** - Schema validation

### UI Components
- **React Icons** - Icon library
- **React Datepicker** - Date picker
- **React Leaflet** hoặc **Google Maps API** - Maps
- **Swiper** hoặc **React Slick** - Image carousel

### Utilities
- **date-fns** hoặc **dayjs** - Date manipulation
- **classnames** - Conditional CSS classes
- **react-toastify** - Toast notifications

---

## 📦 Cài Đặt & Chạy Dự Án

### 1. Cài đặt dependencies
```bash
cd frontend
npm install
```

### 2. Cấu hình environment variables
Tạo file `.env` từ `.env.example`:
```env
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_key
```

### 3. Chạy development server
```bash
npm start
# hoặc
npm run dev
```

### 4. Build production
```bash
npm run build
```

---

## 🎨 Thiết Kế UI/UX

### Màu Sắc Chính
- **Primary**: #0066FF (Blue) - Buttons, links
- **Secondary**: #FF6B6B (Coral) - Highlights, special offers
- **Success**: #51CF66 (Green)
- **Warning**: #FFD43B (Yellow)
- **Error**: #FF6B6B (Red)
- **Neutral**: #F8F9FA (Background), #212529 (Text)

### Typography
- **Heading**: Poppins, sans-serif
- **Body**: Inter, sans-serif
- **Font Sizes**: 12px, 14px, 16px, 18px, 24px, 32px, 48px

### Spacing
- **Base unit**: 8px
- **Spacing scale**: 4px, 8px, 16px, 24px, 32px, 48px, 64px

---

## 🚀 Các Tính Năng Chính Cần Implement

### 1. **Trang Chủ (Home Page)**
- [ ] Hero section với search bar
- [ ] Special offers carousel
- [ ] Trending destinations grid
- [ ] Highest reviewed posts section
- [ ] Newsletter subscription

### 2. **Tìm Kiếm & Lọc (Search & Filter)**
- [ ] Search bar (location, dates, guests)
- [ ] Advanced filters (price, rating, amenities, location)
- [ ] Sort options (price, rating, popularity)
- [ ] Map view integration
- [ ] Pagination

### 3. **Chi Tiết Khách Sạn (Hotel Detail)**
- [ ] Image gallery với lightbox
- [ ] Hotel information (description, location, contact)
- [ ] Room types và pricing
- [ ] Amenities list
- [ ] Reviews và ratings
- [ ] Booking widget (sticky)
- [ ] Map location

### 4. **Đặt Phòng (Booking Flow)**
- [ ] Guest information form
- [ ] Room selection
- [ ] Date selection với calendar
- [ ] Special requests
- [ ] Booking summary
- [ ] Price breakdown

### 5. **Thanh Toán (Payment)**
- [ ] Payment method selection (Credit card, PayPal, etc.)
- [ ] Secure payment form
- [ ] Order summary
- [ ] Confirmation page
- [ ] Email confirmation

### 6. **Xác Thực (Authentication)**
- [ ] Login form
- [ ] Register form
- [ ] Social login (Google, Facebook)
- [ ] Forgot password
- [ ] Email verification

### 7. **User Profile**
- [ ] Profile information
- [ ] Booking history
- [ ] Upcoming bookings
- [ ] Past bookings
- [ ] Reviews management
- [ ] Favorites/Wishlist
- [ ] Settings

### 8. **Reviews & Ratings**
- [ ] Display reviews
- [ ] Write review form
- [ ] Rating system (stars)
- [ ] Review filters (rating, date)
- [ ] Helpful votes

---

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile */
@media (max-width: 576px) { }

/* Tablet */
@media (min-width: 577px) and (max-width: 992px) { }

/* Desktop */
@media (min-width: 993px) { }
```

### Mobile-First Approach
- Thiết kế ưu tiên mobile
- Touch-friendly buttons (min 44x44px)
- Hamburger menu cho mobile
- Swipeable carousels

---

## 🔐 Bảo Mật

### Best Practices
- [ ] Validate input phía client
- [ ] Sanitize user input
- [ ] Secure token storage (httpOnly cookies)
- [ ] HTTPS only
- [ ] CORS configuration
- [ ] XSS protection
- [ ] CSRF protection

---

## ⚡ Performance Optimization

### Strategies
- [ ] Code splitting (React.lazy, Suspense)
- [ ] Image optimization (lazy loading, WebP format)
- [ ] Memoization (React.memo, useMemo, useCallback)
- [ ] Debounce search input
- [ ] Virtual scrolling cho long lists
- [ ] Service Worker cho caching
- [ ] Bundle size optimization

---

## 🧪 Testing

### Testing Strategy
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Tools
- **Jest** - Unit testing
- **React Testing Library** - Component testing
- **Cypress** hoặc **Playwright** - E2E testing

---

## 📚 Tài Liệu Tham Khảo

### API Documentation
- Backend API docs: `http://localhost:8080/api/docs`

### Design System
- Figma/Adobe XD design files
- Component storybook

---

## 🤝 Quy Trình Làm Việc

### 1. **Planning Phase**
- Phân tích requirements
- Thiết kế wireframes/mockups
- Xác định components cần thiết

### 2. **Development Phase**
- Setup project structure
- Implement components (từ nhỏ đến lớn)
- Integrate APIs
- Styling và responsive

### 3. **Testing Phase**
- Unit tests
- Integration tests
- Manual testing
- Bug fixes

### 4. **Deployment**
- Build production
- Deploy lên server
- Monitor performance

---

## ✅ Checklist Triển Khai

### Phase 1: Setup & Core Components (Week 1-2)
- [ ] Setup project với Vite/CRA
- [ ] Cấu hình React Router
- [ ] Setup Redux Toolkit
- [ ] Cấu hình Axios client
- [ ] Tạo common components (Button, Input, Modal, Loading)
- [ ] Setup global styles và CSS variables
- [ ] Implement Header & Footer

### Phase 2: Home & Search (Week 3-4)
- [ ] Implement Home page
- [ ] Hero section với search bar
- [ ] Special offers section
- [ ] Trending destinations
- [ ] Search result page
- [ ] Filters và sorting
- [ ] Pagination

### Phase 3: Hotel Detail & Booking (Week 5-6)
- [ ] Hotel detail page
- [ ] Image gallery
- [ ] Reviews section
- [ ] Booking page
- [ ] Guest information form
- [ ] Booking summary

### Phase 4: Payment & Auth (Week 7-8)
- [ ] Payment integration
- [ ] Login/Register pages
- [ ] Social login
- [ ] Forgot password
- [ ] Protected routes

### Phase 5: User Profile & Polish (Week 9-10)
- [ ] User profile page
- [ ] Booking history
- [ ] Reviews management
- [ ] Favorites
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Testing

---

## 🐛 Troubleshooting

### Common Issues

**1. CORS Error**
```javascript
// axiosClient.js
axios.defaults.withCredentials = true;
```

**2. Build Error**
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules
npm install
```

**3. Environment Variables Not Working**
- Đảm bảo prefix `REACT_APP_` cho CRA
- Restart dev server sau khi thay đổi .env

---

## 📞 Liên Hệ & Hỗ Trợ

- **Project Lead**: [Tên của bạn]
- **Email**: [Email]
- **Documentation**: [Link]
- **Issue Tracker**: [GitHub Issues]

---

## 📝 Notes

### Những Điểm Cần Lưu Ý:
1. **State Management**: Quyết định giữa Redux Toolkit hoặc React Query + Context API
2. **Styling**: Chọn CSS Modules, Styled Components, hoặc Tailwind CSS
3. **Form Handling**: Sử dụng React Hook Form cho performance tốt hơn
4. **Image Optimization**: Implement lazy loading và responsive images
5. **SEO**: Cân nhắc SSR với Next.js nếu cần SEO tốt hơn

### Các Thư Viện Nên Cài Đặt:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@reduxjs/toolkit": "^2.0.0",
    "react-redux": "^9.0.0",
    "axios": "^1.6.0",
    "react-hook-form": "^7.49.0",
    "yup": "^1.3.0",
    "date-fns": "^3.0.0",
    "react-icons": "^5.0.0",
    "react-datepicker": "^4.25.0",
    "react-toastify": "^10.0.0",
    "swiper": "^11.0.0",
    "classnames": "^2.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

---

**Chúc bạn code vui vẻ! 🚀**
