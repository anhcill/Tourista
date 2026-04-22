// API Configuration
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    OAUTH2_EXCHANGE: "/auth/oauth2/exchange",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    VERIFY_EMAIL: "/auth/verify-email",
  },

  // Hotels
  HOTELS: {
    LIST: "/hotels",
    DETAIL: "/hotels/:id",
    SEARCH: "/hotels/search",
    FEATURED: "/hotels/featured",
    TRENDING: "/hotels/trending",
  },

  // Tours
  TOURS: {
    LIST: "/tours",
    DETAIL: "/tours/:id",
    SEARCH: "/tours/search",
    FEATURED: "/tours/featured",
    REVIEWS: "/tours/:id/reviews",
    SIMILAR: "/tours/:id/similar",
  },

  // Home
  HOME: {
    TESTIMONIALS: "/home/testimonials",
    COMPARE_CATEGORIES: "/home/compare-categories",
    DASHBOARD_STATS: "/home/dashboard-stats",
  },

  // Bookings
  BOOKINGS: {
    CREATE: "/bookings",
    CREATE_TOUR: "/bookings/tours",
    LIST: "/bookings",
    MY: "/bookings/my",
    DETAIL: "/bookings/:id",
    CANCEL: "/bookings/:id/cancel",
    UPDATE: "/bookings/:id",
  },

  // Reviews
  REVIEWS: {
    LIST: "/reviews",
    CREATE: "/reviews",
    UPDATE: "/reviews/:id",
    DELETE: "/reviews/:id",
    BY_HOTEL: "/hotels/:hotelId/reviews",
  },

  // Payments
  PAYMENTS: {
    CREATE: "/payments",
    VERIFY: "/payments/verify",
    METHODS: "/payments/methods",
  },

  // User
  USER: {
    PROFILE: "/users/me",
    UPDATE: "/users/me",
    BOOKINGS: "/bookings/my",
    REVIEWS: "/reviews/my",
    FAVORITES: "/favorites",
  },

  // Articles
  ARTICLES: {
    LIST: "/articles",
    FEATURED: "/articles/featured",
    DETAIL: "/articles/:slug",
    CREATE: "/articles",
    UPDATE: "/articles/:id",
    DELETE: "/articles/:id",
    LIKE: "/articles/:id/like",
    COMMENTS: "/articles/:id/comments",
    COMMENT_DELETE: "/articles/comments/:commentId",
  },

  // Promotions
  PROMOTIONS: {
    LIST: "/promotions",
  },
};

// App Routes
export const ROUTES = {
  HOME: "/",
  SEARCH: "/search",
  HOTEL_DETAIL: "/hotels/:id",
  TOUR_DETAIL: "/tours/:id",
  BOOKING: "/booking",
  PAYMENT: "/payment",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",
  BOOKINGS: "/profile/bookings",
  FAVORITES: "/profile/favorites",
  NOT_FOUND: "/404",
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  LIMITS: [12, 24, 36, 48],
};

// Sort Options
export const SORT_OPTIONS = {
  PRICE_LOW_HIGH: "price_asc",
  PRICE_HIGH_LOW: "price_desc",
  RATING_HIGH_LOW: "rating_desc",
  POPULARITY: "popularity_desc",
  NEWEST: "created_desc",
};

// Filter Options
export const FILTER_OPTIONS = {
  PRICE_RANGES: [
    { label: "Dưới 500K", min: 0, max: 500000 },
    { label: "500K - 1 Triệu", min: 500000, max: 1000000 },
    { label: "1 Triệu - 2.5 Triệu", min: 1000000, max: 2500000 },
    { label: "2.5 Triệu - 5 Triệu", min: 2500000, max: 5000000 },
    { label: "Trên 5 Triệu", min: 5000000, max: 999999999 },
  ],

  RATINGS: [
    { label: "5 Stars", value: 5 },
    { label: "4+ Stars", value: 4 },
    { label: "3+ Stars", value: 3 },
    { label: "2+ Stars", value: 2 },
  ],

  AMENITIES: [
    { id: "wifi", label: "Free WiFi" },
    { id: "parking", label: "Free Parking" },
    { id: "pool", label: "Swimming Pool" },
    { id: "gym", label: "Fitness Center" },
    { id: "spa", label: "Spa" },
    { id: "restaurant", label: "Restaurant" },
    { id: "bar", label: "Bar" },
    { id: "breakfast", label: "Breakfast Included" },
    { id: "pet_friendly", label: "Pet Friendly" },
    { id: "air_conditioning", label: "Air Conditioning" },
  ],
};

// Date Format
export const DATE_FORMAT = {
  DISPLAY: "MMM dd, yyyy",
  API: "yyyy-MM-dd",
  FULL: "MMMM dd, yyyy",
  TIME: "HH:mm",
  DATETIME: "MMM dd, yyyy HH:mm",
};

// Currency
export const CURRENCY = {
  SYMBOL: "₫",
  CODE: "VND",
  LOCALE: "vi-VN",
};

// Toast Messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    LOGIN: "Đăng nhập thành công!",
    REGISTER: "Đăng ký thành công!",
    BOOKING: "Đặt phòng thành công!",
    PAYMENT: "Thanh toán thành công!",
    REVIEW: "Đánh giá đã được gửi!",
    UPDATE: "Cập nhật thành công!",
  },
  ERROR: {
    LOGIN: "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
    REGISTER: "Đăng ký thất bại. Email có thể đã tồn tại.",
    BOOKING: "Đặt phòng thất bại. Vui lòng thử lại.",
    PAYMENT: "Thanh toán thất bại. Vui lòng kiểm tra lại.",
    NETWORK: "Lỗi kết nối. Vui lòng kiểm tra internet.",
    GENERIC: "Có lỗi xảy ra. Vui lòng thử lại.",
  },
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: "tourista_token",
  REFRESH_TOKEN: "tourista_refresh_token",
  USER: "tourista_user",
  SEARCH_HISTORY: "tourista_search_history",
  FAVORITES: "tourista_favorites",
};

// Validation Rules
export const VALIDATION = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE: /^[0-9]{10,11}$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
};

// Image Placeholders
export const PLACEHOLDERS = {
  HOTEL: "/images/placeholder-hotel.jpg",
  TOUR: "/images/placeholder-tour.jpg",
  AVATAR: "/images/placeholder-avatar.jpg",
  NO_IMAGE: "/images/no-image.jpg",
};

// Social Links
export const SOCIAL_LINKS = {
  FACEBOOK: "https://www.facebook.com/tourista",
  TWITTER: "https://twitter.com/tourista",
  INSTAGRAM: "https://www.instagram.com/tourista",
  YOUTUBE: "https://www.youtube.com/tourista",
  TIKTOK: "https://www.tiktok.com/@tourista",
  LINKEDIN: "https://www.linkedin.com/company/tourista",
};

// Contact Info
export const CONTACT_INFO = {
  EMAIL: "contact@tourista.vn",
  PHONE: "1900-xxxx",
  ZALO: "https://zalo.me/tourista",
  ADDRESS: "Hà Nội, Việt Nam",
};
