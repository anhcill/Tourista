import type { Page, Route } from '@playwright/test';

type ApiPayload = {
  success?: boolean;
  message?: string;
  data?: unknown;
  errors?: Record<string, string>;
};

type ApiMockOptions = {
  loginRole?: 'USER' | 'ADMIN';
  bookingCreateStatus?: 'success' | 'failure';
  profileStatus?: 200 | 401;
  refreshStatus?: 200 | 401;
  vnpayVerifySuccess?: boolean;
};

const MOCK_CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': '*',
};

const respond = async (route: Route, status: number, payload: ApiPayload) => {
  await route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    headers: MOCK_CORS_HEADERS,
    body: JSON.stringify({
      success: payload.success ?? status < 400,
      message: payload.message ?? (status < 400 ? 'OK' : 'Error'),
      data: payload.data,
      errors: payload.errors,
    }),
  });
};

const getLoginUser = (role: 'USER' | 'ADMIN') => ({
  id: role === 'ADMIN' ? 1 : 2,
  email: role === 'ADMIN' ? 'admin@tourista.vn' : 'user@tourista.vn',
  fullName: role === 'ADMIN' ? 'Tourista Admin' : 'Tourista User',
  role,
  avatarUrl: '',
  phone: role === 'ADMIN' ? '0900000001' : '0900000002',
});

const tourSummary = {
  id: 1,
  title: 'Da Nang Discovery 4N3D',
  city: 'Da Nang',
  coverImage: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80',
  durationDays: 4,
  durationNights: 3,
  difficulty: 'EASY',
  avgRating: 4.8,
  reviewCount: 128,
  pricePerAdult: 3900000,
  pricePerChild: 2500000,
  nearestDepartureDate: '2026-08-20',
  availableSlots: 18,
};

const tourDetail = {
  id: 1,
  title: 'Da Nang Discovery 4N3D',
  city: 'Da Nang',
  categoryName: 'Adventure',
  description: 'Tour da nang day du diem den noi bat.',
  highlights: ['Ba Na Hills', 'Hoi An', 'My Khe Beach'],
  includes: ['Xe dua don', 'Huong dan vien', 'Khach san 4 sao'],
  excludes: ['Chi phi ca nhan'],
  durationDays: 4,
  durationNights: 3,
  difficulty: 'EASY',
  maxGroupSize: 20,
  avgRating: 4.8,
  reviewCount: 128,
  images: [
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80',
  ],
  pricePerAdult: 3900000,
  pricePerChild: 2500000,
  departures: [
    {
      departureId: 501,
      departureDate: '2026-08-20',
      availableSlots: 18,
      priceOverride: null,
    },
  ],
  itinerary: [
    { dayNumber: 1, title: 'Arrival', description: 'Nhan phong va city tour.' },
    { dayNumber: 2, title: 'Ba Na', description: 'Tham quan Ba Na Hills.' },
  ],
};

const tourReviews = [
  {
    id: 201,
    userName: 'Minh',
    overallRating: 5,
    comment: 'Tour rat tuyet voi',
    createdAt: '2026-03-01T10:00:00Z',
    helpfulCount: 2,
  },
];

const similarTours = [
  {
    id: 2,
    title: 'Hoi An Relax 3N2D',
    city: 'Hoi An',
    durationDays: 3,
    durationNights: 2,
    avgRating: 4.7,
    pricePerAdult: 3200000,
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
  },
];

const userProfile = {
  id: 2,
  fullName: 'Tourista User',
  email: 'user@tourista.vn',
  phone: '0900000002',
  avatarUrl: '',
  role: 'USER',
};

const favorites = [
  {
    id: 9001,
    type: 'TOUR',
    targetId: 1,
    title: 'Da Nang Discovery 4N3D',
    location: 'Da Nang',
    rating: 4.8,
    reviewCount: 128,
    priceFrom: 3900000,
    imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80',
  },
  {
    id: 9002,
    type: 'HOTEL',
    targetId: 10,
    title: 'Ocean View Hotel',
    location: 'Da Nang',
    rating: 4.5,
    reviewCount: 98,
    priceFrom: 1200000,
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
  },
];

const myBookings = [
  {
    bookingId: 111,
    bookingCode: 'TRS-12345',
    bookingType: 'TOUR',
    tourId: 1,
    tourTitle: 'Da Nang Discovery 4N3D',
    departureId: 501,
    departureDate: '2026-08-20',
    adults: 2,
    children: 1,
    totalAmount: 10300000,
    currency: 'VND',
    status: 'CONFIRMED',
    createdAt: '2026-04-14T10:00:00Z',
    partnerId: 333,
  },
  {
    bookingId: 222,
    bookingCode: 'HOT-88888',
    bookingType: 'HOTEL',
    hotelId: 10,
    hotelName: 'Ocean View Hotel',
    roomTypeName: 'Deluxe',
    checkIn: '2026-07-11',
    checkOut: '2026-07-13',
    nights: 2,
    rooms: 1,
    adults: 2,
    children: 0,
    totalAmount: 2400000,
    currency: 'VND',
    status: 'PENDING',
    createdAt: '2026-04-13T09:00:00Z',
    ownerId: 444,
  },
];

const adminBookings = {
  content: [
    {
      bookingCode: 'TRS-12345',
      bookingType: 'TOUR',
      guestName: 'Tourista User',
      createdAt: '2026-04-14T10:00:00Z',
      status: 'CONFIRMED',
      totalAmount: 10300000,
      currency: 'VND',
    },
  ],
  totalElements: 1,
  page: 1,
  size: 80,
};

const adminHotels = {
  content: [{ id: 10, name: 'Ocean View Hotel' }],
  totalElements: 12,
  page: 1,
  size: 1,
};

const adminTours = {
  content: [{ id: 1, title: 'Da Nang Discovery 4N3D' }],
  totalElements: 9,
  page: 1,
  size: 1,
};

const chatConversations: Array<Record<string, unknown>> = [];

export const mockApi = async (page: Page, options: ApiMockOptions = {}) => {
  const loginRole = options.loginRole ?? 'USER';
  const bookingCreateStatus = options.bookingCreateStatus ?? 'success';
  const profileStatus = options.profileStatus ?? 200;
  const refreshStatus = options.refreshStatus ?? 200;
  const vnpayVerifySuccess = options.vnpayVerifySuccess ?? true;

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const method = req.method().toUpperCase();
    const url = new URL(req.url());
    const path = url.pathname;

    // CORS preflight for cross-origin API base URL in browser tests.
    if (method === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: MOCK_CORS_HEADERS,
      });
    }

    // Auth
    if (path.endsWith('/api/auth/login') && method === 'POST') {
      return respond(route, 200, {
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: getLoginUser(loginRole),
        },
      });
    }
    if (path.endsWith('/api/auth/refresh') && method === 'POST') {
      if (refreshStatus >= 400) {
        return respond(route, refreshStatus, {
          message: 'Refresh token expired',
          data: null,
        });
      }
      return respond(route, 200, {
        data: {
          accessToken: 'mock-access-token-refreshed',
          refreshToken: 'mock-refresh-token-refreshed',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: getLoginUser(loginRole),
        },
      });
    }

    // Header/support APIs
    if (path.endsWith('/api/tours') && method === 'GET') {
      return respond(route, 200, { data: [tourSummary] });
    }
    if (path.endsWith('/api/chat/conversations') && method === 'GET') {
      return respond(route, 200, { data: chatConversations });
    }
    if (path.includes('/api/chat/conversations') && method === 'POST') {
      return respond(route, 200, {
        data: { id: 555, partnerName: 'Partner Mock' },
      });
    }
    if (path.includes('/api/chat/conversations') && method === 'PATCH') {
      return respond(route, 200, { data: {} });
    }
    if (path.includes('/api/chat/conversations') && method === 'GET') {
      return respond(route, 200, { data: { content: [] } });
    }

    // Tours
    if (path.endsWith('/api/tours/search') && method === 'GET') {
      return respond(route, 200, { data: [tourSummary] });
    }
    if (path.endsWith('/api/tours/1') && method === 'GET') {
      return respond(route, 200, { data: tourDetail });
    }
    if (path.endsWith('/api/tours/1/reviews') && method === 'GET') {
      return respond(route, 200, { data: tourReviews });
    }
    if (path.endsWith('/api/tours/1/similar') && method === 'GET') {
      return respond(route, 200, { data: similarTours });
    }

    // Booking + payment
    if (path.endsWith('/api/bookings/tours') && method === 'POST') {
      if (bookingCreateStatus === 'failure') {
        return respond(route, 500, {
          message: 'Khong the tao booking tour luc nay.',
          data: null,
        });
      }
      return respond(route, 201, {
        data: {
          bookingId: 111,
          bookingCode: 'TRS-12345',
          totalAmount: 10300000,
          status: 'PENDING',
          currency: 'VND',
          tourId: 1,
          departureId: 501,
        },
      });
    }
    if (path.endsWith('/api/payments/vnpay/return') && method === 'GET') {
      return respond(route, 200, {
        data: {
          success: vnpayVerifySuccess,
          message: vnpayVerifySuccess
            ? 'Thanh toan thanh cong qua VNPay.'
            : 'Giao dich bi huy hoac khong thanh cong.',
          bookingCode: 'TRS-12345',
          amount: 10300000,
          transactionNo: 'VNP-998877',
          bookingStatus: vnpayVerifySuccess ? 'CONFIRMED' : 'PENDING',
          responseCode: vnpayVerifySuccess ? '00' : '24',
          validSignature: true,
        },
      });
    }
    if (path.endsWith('/api/bookings/my') && method === 'GET') {
      return respond(route, 200, { data: myBookings });
    }

    // User profile
    if (path.endsWith('/api/users/me') && method === 'GET') {
      if (profileStatus >= 400) {
        return respond(route, profileStatus, {
          message: 'Unauthorized',
          data: null,
        });
      }
      return respond(route, 200, { data: userProfile });
    }
    if (path.endsWith('/api/users/me') && method === 'PATCH') {
      const body = req.postDataJSON() as Record<string, unknown>;
      return respond(route, 200, {
        data: {
          ...userProfile,
          ...body,
        },
      });
    }

    // Favorites
    if (path.endsWith('/api/favorites') && method === 'GET') {
      return respond(route, 200, { data: favorites });
    }
    if (path.endsWith('/api/favorites') && method === 'DELETE') {
      return respond(route, 200, { data: {} });
    }

    // Admin dashboard dependencies
    if (path.endsWith('/api/admin/bookings') && method === 'GET') {
      return respond(route, 200, { data: adminBookings });
    }
    if (path.endsWith('/api/admin/hotels') && method === 'GET') {
      return respond(route, 200, { data: adminHotels });
    }
    if (path.endsWith('/api/admin/tours') && method === 'GET') {
      return respond(route, 200, { data: adminTours });
    }

    // Unknown API calls fallback to an empty successful response for stable E2E.
    return respond(route, 200, { data: [] });
  });
};
