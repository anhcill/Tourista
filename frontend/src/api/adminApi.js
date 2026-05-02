import axiosClient from "./axiosClient";

const tryGetList = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value !== "object") return null;

  const keys = [
    "data",
    "items",
    "content",
    "result",
    "results",
    "list",
    "users",
    "hotels",
    "tours",
    "bookings",
    "reviews",
    "promotions",
    "auditLogs",
  ];
  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key];
  }

  return null;
};

const extractList = (response) => {
  const direct = tryGetList(response);
  if (direct) return direct;

  const nestKeys = ["data", "result", "payload"];
  for (const key of nestKeys) {
    const nested = tryGetList(response?.[key]);
    if (nested) return nested;
  }

  for (const key of nestKeys) {
    for (const subKey of nestKeys) {
      const deepNested = tryGetList(response?.[key]?.[subKey]);
      if (deepNested) return deepNested;
    }
  }

  return [];
};

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const extractPaging = (
  response,
  fallbackPage = 1,
  fallbackSize = 10,
  fallbackTotal = 0,
) => {
  const candidates = [
    response,
    response?.data,
    response?.result,
    response?.payload,
    response?.data?.data,
    response?.data?.result,
  ];

  let total = null;
  let page = null;
  let size = null;

  for (const item of candidates) {
    if (!item || typeof item !== "object") continue;

    total =
      total ??
      toNumber(item.total) ??
      toNumber(item.totalItems) ??
      toNumber(item.totalElements);
    page =
      page ??
      toNumber(item.page) ??
      toNumber(item.currentPage) ??
      toNumber(item.pageNumber);
    size =
      size ??
      toNumber(item.size) ??
      toNumber(item.limit) ??
      toNumber(item.pageSize);
  }

  return {
    total: total ?? fallbackTotal,
    page: page ?? fallbackPage,
    size: size ?? fallbackSize,
  };
};

const asDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const bookingTypeOf = (booking) => {
  const bookingType = String(booking?.bookingType || "").toUpperCase();
  if (bookingType === "TOUR" || (booking?.tourId && !booking?.hotelId))
    return "TOUR";
  return "HOTEL";
};

const normalizeBookings = (bookings) => {
  return bookings
    .map((booking) => {
      const createdAt =
        asDate(
          booking?.createdAt || booking?.createdDate || booking?.created_time,
        )?.toISOString() || null;

      return {
        bookingCode: String(
          booking?.bookingCode || booking?.code || booking?.id || "N/A",
        ),
        bookingType: bookingTypeOf(booking),
        guestName: String(
          booking?.guestName ||
            booking?.userName ||
            booking?.customerName ||
            booking?.fullName ||
            booking?.email ||
            "Unknown",
        ),
        createdAt,
        status: String(booking?.status || "PENDING").toUpperCase(),
        totalAmount: Number(booking?.totalAmount || booking?.amount || 0),
        currency: String(booking?.currency || "VND"),
      };
    })
    .sort((a, b) => {
      const timeA = asDate(a.createdAt)?.getTime() || 0;
      const timeB = asDate(b.createdAt)?.getTime() || 0;
      return timeB - timeA;
    });
};

const buildMonthBuckets = (size = 6) => {
  const now = new Date();
  const buckets = [];

  for (let i = size - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: `T${date.getMonth() + 1}/${String(date.getFullYear()).slice(-2)}`,
      value: 0,
    });
  }

  return buckets;
};

const buildRevenueSeries = (bookings) => {
  const buckets = buildMonthBuckets(6);
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  bookings.forEach((booking) => {
    const createdAt = asDate(booking.createdAt);
    if (!createdAt) return;

    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = bucketMap.get(key);
    if (!bucket) return;

    bucket.value += Number(booking.totalAmount || 0);
  });

  return buckets;
};

const createMockBookings = () => {
  const now = new Date();
  return [
    {
      bookingCode: "BK-AD-9021",
      bookingType: "HOTEL",
      guestName: "Nguyen Van An",
      createdAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
      status: "CONFIRMED",
      totalAmount: 3200000,
      currency: "VND",
    },
    {
      bookingCode: "BK-AD-9020",
      bookingType: "TOUR",
      guestName: "Tran Bao Chau",
      createdAt: new Date(now.getTime() - 9 * 3600000).toISOString(),
      status: "PENDING",
      totalAmount: 1890000,
      currency: "VND",
    },
    {
      bookingCode: "BK-AD-9019",
      bookingType: "HOTEL",
      guestName: "Le Minh Khang",
      createdAt: new Date(now.getTime() - 15 * 3600000).toISOString(),
      status: "CONFIRMED",
      totalAmount: 2780000,
      currency: "VND",
    },
    {
      bookingCode: "BK-AD-9018",
      bookingType: "TOUR",
      guestName: "Do Thuy Linh",
      createdAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
      status: "COMPLETED",
      totalAmount: 2450000,
      currency: "VND",
    },
    {
      bookingCode: "BK-AD-9017",
      bookingType: "HOTEL",
      guestName: "Pham Quoc Huy",
      createdAt: new Date(now.getTime() - 31 * 3600000).toISOString(),
      status: "PENDING",
      totalAmount: 1560000,
      currency: "VND",
    },
    {
      bookingCode: "BK-AD-9016",
      bookingType: "TOUR",
      guestName: "Hoang Gia Bao",
      createdAt: new Date(now.getTime() - 40 * 3600000).toISOString(),
      status: "CANCELLED",
      totalAmount: 990000,
      currency: "VND",
    },
  ];
};

const countTodayBookings = (bookings) => {
  const now = new Date();
  return bookings.filter((booking) => {
    const createdAt = asDate(booking.createdAt);
    if (!createdAt) return false;

    return (
      createdAt.getDate() === now.getDate() &&
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getFullYear() === now.getFullYear()
    );
  }).length;
};

const normalizeRole = (value) => {
  const normalized = String(value || "USER").toUpperCase();
  if (normalized === "ADMIN" || normalized === "HOST") return normalized;
  return "USER";
};

const normalizeStatus = (value) => {
  const normalized = String(value || "ACTIVE").toUpperCase();
  if (normalized === "LOCKED" || normalized === "BANNED") return normalized;
  return "ACTIVE";
};

const normalizeHotelStatus = (value, isActive) => {
  const normalized = String(value || "").toUpperCase();

  if (
    normalized === "PENDING" ||
    normalized === "APPROVED" ||
    normalized === "REJECTED" ||
    normalized === "SUSPENDED"
  ) {
    return normalized;
  }

  if (typeof isActive === "boolean") {
    return isActive ? "APPROVED" : "SUSPENDED";
  }

  return "PENDING";
};

const normalizeTourStatus = (value, isActive) => {
  const normalized = String(value || "").toUpperCase();

  if (
    normalized === "PENDING" ||
    normalized === "APPROVED" ||
    normalized === "REJECTED" ||
    normalized === "SUSPENDED"
  ) {
    return normalized;
  }

  if (typeof isActive === "boolean") {
    return isActive ? "APPROVED" : "SUSPENDED";
  }

  return "PENDING";
};

const normalizeBookingWorkflowStatus = (value) => {
  const normalized = String(value || "PENDING").toUpperCase();
  if (
    normalized === "CONFIRMED" ||
    normalized === "CHECKED_IN" ||
    normalized === "COMPLETED" ||
    normalized === "CANCELLED" ||
    normalized === "REFUNDED"
  ) {
    return normalized;
  }
  return "PENDING";
};

const normalizePaymentStatus = (value) => {
  const normalized = String(value || "PENDING").toUpperCase();
  if (
    normalized === "PAID" ||
    normalized === "FAILED" ||
    normalized === "REFUNDED"
  ) {
    return normalized;
  }
  return "PENDING";
};

const normalizePromotionType = (value) => {
  const normalized = String(value || "PERCENT").toUpperCase();
  return normalized === "FIXED" ? "FIXED" : "PERCENT";
};

const promotionLifecycleStatusOf = (promotion) => {
  if (!promotion?.isActive) return "INACTIVE";

  const now = Date.now();
  const start = asDate(promotion?.startAt)?.getTime();
  const end = asDate(promotion?.endAt)?.getTime();

  if (Number.isFinite(start) && now < start) return "UPCOMING";
  if (Number.isFinite(end) && now > end) return "EXPIRED";
  return "ACTIVE";
};

const normalizeUsers = (users) => {
  return users
    .map((user) => {
      const createdAt =
        asDate(
          user?.createdAt || user?.created_at || user?.createdDate,
        )?.toISOString() || null;

      const lastLoginAt =
        asDate(
          user?.lastLoginAt || user?.last_login_at || user?.lastLogin,
        )?.toISOString() || null;

      const roleName =
        user?.roleName ||
        user?.role?.name ||
        user?.role ||
        user?.authorities?.[0] ||
        "USER";

      return {
        id: String(user?.id || user?.userId || user?.email || Math.random()),
        fullName: String(user?.fullName || user?.name || "Unknown User"),
        email: String(user?.email || ""),
        phone: String(user?.phone || "-"),
        role: normalizeRole(roleName),
        status: normalizeStatus(user?.status),
        isEmailVerified: Boolean(
          user?.isEmailVerified ??
          user?.emailVerified ??
          user?.verified ??
          false,
        ),
        authProvider: String(
          user?.authProvider || user?.provider || "LOCAL",
        ).toUpperCase(),
        createdAt,
        lastLoginAt,
      };
    })
    .sort((a, b) => {
      const timeA = asDate(a.createdAt)?.getTime() || 0;
      const timeB = asDate(b.createdAt)?.getTime() || 0;
      return timeB - timeA;
    });
};

const createMockUsers = () => {
  const now = Date.now();
  return normalizeUsers([
    {
      id: 1,
      fullName: "Tran Minh Admin",
      email: "admin@tourista.vn",
      phone: "0901000001",
      role: "ADMIN",
      status: "ACTIVE",
      isEmailVerified: true,
      authProvider: "LOCAL",
      createdAt: new Date(now - 60 * 24 * 3600000).toISOString(),
      lastLoginAt: new Date(now - 1 * 3600000).toISOString(),
    },
    {
      id: 2,
      fullName: "Nguyen Van Khang",
      email: "khang.nguyen@example.com",
      phone: "0902000002",
      role: "USER",
      status: "ACTIVE",
      isEmailVerified: true,
      authProvider: "LOCAL",
      createdAt: new Date(now - 45 * 24 * 3600000).toISOString(),
      lastLoginAt: new Date(now - 6 * 3600000).toISOString(),
    },
    {
      id: 3,
      fullName: "Le Thu Ha",
      email: "ha.le@example.com",
      phone: "0903000003",
      role: "HOST",
      status: "ACTIVE",
      isEmailVerified: true,
      authProvider: "GOOGLE",
      createdAt: new Date(now - 38 * 24 * 3600000).toISOString(),
      lastLoginAt: new Date(now - 12 * 3600000).toISOString(),
    },
    {
      id: 4,
      fullName: "Pham Gia Huy",
      email: "huy.pham@example.com",
      phone: "0904000004",
      role: "USER",
      status: "LOCKED",
      isEmailVerified: false,
      authProvider: "LOCAL",
      createdAt: new Date(now - 22 * 24 * 3600000).toISOString(),
      lastLoginAt: new Date(now - 11 * 24 * 3600000).toISOString(),
    },
    {
      id: 5,
      fullName: "Vo Bao Ngoc",
      email: "ngoc.vo@example.com",
      phone: "0905000005",
      role: "USER",
      status: "BANNED",
      isEmailVerified: true,
      authProvider: "LOCAL",
      createdAt: new Date(now - 16 * 24 * 3600000).toISOString(),
      lastLoginAt: new Date(now - 13 * 24 * 3600000).toISOString(),
    },
    {
      id: 6,
      fullName: "Doan Anh Tuan",
      email: "tuan.doan@example.com",
      phone: "0906000006",
      role: "HOST",
      status: "ACTIVE",
      isEmailVerified: true,
      authProvider: "GOOGLE",
      createdAt: new Date(now - 11 * 24 * 3600000).toISOString(),
      lastLoginAt: new Date(now - 4 * 3600000).toISOString(),
    },
    {
      id: 7,
      fullName: "Bui Thi Mai",
      email: "mai.bui@example.com",
      phone: "0907000007",
      role: "USER",
      status: "ACTIVE",
      isEmailVerified: false,
      authProvider: "LOCAL",
      createdAt: new Date(now - 7 * 24 * 3600000).toISOString(),
      lastLoginAt: new Date(now - 18 * 3600000).toISOString(),
    },
    {
      id: 8,
      fullName: "Hoang Khanh Linh",
      email: "linh.hoang@example.com",
      phone: "0908000008",
      role: "USER",
      status: "ACTIVE",
      isEmailVerified: true,
      authProvider: "LOCAL",
      createdAt: new Date(now - 2 * 24 * 3600000).toISOString(),
      lastLoginAt: new Date(now - 2 * 3600000).toISOString(),
    },
  ]);
};

const filterUsers = (users, { search = "", role = "ALL", status = "ALL" }) => {
  const searchTerm = String(search || "")
    .trim()
    .toLowerCase();
  const roleFilter = String(role || "ALL").toUpperCase();
  const statusFilter = String(status || "ALL").toUpperCase();

  return users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.fullName.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      String(user.phone || "")
        .toLowerCase()
        .includes(searchTerm);

    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });
};

const normalizeHotels = (hotels) => {
  return hotels
    .map((hotel) => {
      const createdAt =
        asDate(
          hotel?.createdAt || hotel?.created_at || hotel?.createdDate,
        )?.toISOString() || null;
      const updatedAt =
        asDate(
          hotel?.updatedAt || hotel?.updated_at || hotel?.updatedDate,
        )?.toISOString() || null;

      const hostName =
        hotel?.hostName ||
        hotel?.ownerName ||
        hotel?.host?.fullName ||
        hotel?.createdByName ||
        "Unknown Host";

      const hostEmail =
        hotel?.hostEmail ||
        hotel?.ownerEmail ||
        hotel?.host?.email ||
        hotel?.createdByEmail ||
        "-";

      return {
        id: String(hotel?.id || hotel?.hotelId || hotel?.code || Math.random()),
        name: String(hotel?.name || hotel?.hotelName || "Unnamed Hotel"),
        city: String(
          hotel?.city || hotel?.locationCity || hotel?.province || "Unknown",
        ),
        address: String(hotel?.address || hotel?.location || "-"),
        starRating: Number(hotel?.starRating || hotel?.stars || 0),
        avgRating: Number(hotel?.avgRating || hotel?.rating || 0),
        reviewCount: Number(hotel?.reviewCount || hotel?.reviews || 0),
        hostName: String(hostName),
        hostEmail: String(hostEmail),
        status: normalizeHotelStatus(
          hotel?.status || hotel?.approvalStatus,
          hotel?.isActive,
        ),
        createdAt,
        updatedAt,
      };
    })
    .sort((a, b) => {
      const timeA = asDate(a.createdAt)?.getTime() || 0;
      const timeB = asDate(b.createdAt)?.getTime() || 0;
      return timeB - timeA;
    });
};

const createMockHotels = () => {
  const now = Date.now();
  return normalizeHotels([
    {
      id: 101,
      name: "Sea Light Da Nang Hotel",
      city: "Da Nang",
      address: "12 Vo Nguyen Giap, Son Tra",
      starRating: 4,
      avgRating: 4.6,
      reviewCount: 382,
      hostName: "Tran Hoang",
      hostEmail: "hoang.host@example.com",
      status: "PENDING",
      createdAt: new Date(now - 11 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 1 * 24 * 3600000).toISOString(),
    },
    {
      id: 102,
      name: "Heritage River Hotel",
      city: "Hoi An",
      address: "36 Tran Phu, Hoi An",
      starRating: 5,
      avgRating: 4.8,
      reviewCount: 521,
      hostName: "Nguyen Minh Chau",
      hostEmail: "chau.host@example.com",
      status: "APPROVED",
      createdAt: new Date(now - 40 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 6 * 24 * 3600000).toISOString(),
    },
    {
      id: 103,
      name: "Cloud Peak Sapa Resort",
      city: "Lao Cai",
      address: "08 Fansipan, Sapa",
      starRating: 4,
      avgRating: 4.4,
      reviewCount: 267,
      hostName: "Do Van Tuan",
      hostEmail: "tuan.host@example.com",
      status: "REJECTED",
      createdAt: new Date(now - 19 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 14 * 24 * 3600000).toISOString(),
    },
    {
      id: 104,
      name: "Saigon Central Boutique",
      city: "Ho Chi Minh",
      address: "55 Nguyen Hue, District 1",
      starRating: 3,
      avgRating: 4.1,
      reviewCount: 148,
      hostName: "Pham Quoc Bao",
      hostEmail: "bao.host@example.com",
      status: "SUSPENDED",
      createdAt: new Date(now - 28 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 5 * 24 * 3600000).toISOString(),
    },
    {
      id: 105,
      name: "Hanoi Old Quarter Suites",
      city: "Ha Noi",
      address: "23 Ma May, Hoan Kiem",
      starRating: 4,
      avgRating: 4.5,
      reviewCount: 305,
      hostName: "Le Thi Mai",
      hostEmail: "mai.host@example.com",
      status: "PENDING",
      createdAt: new Date(now - 9 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 3 * 24 * 3600000).toISOString(),
    },
    {
      id: 106,
      name: "Nha Trang Ocean View",
      city: "Nha Trang",
      address: "88 Tran Phu, Nha Trang",
      starRating: 5,
      avgRating: 4.7,
      reviewCount: 443,
      hostName: "Vo Khanh Linh",
      hostEmail: "linh.host@example.com",
      status: "APPROVED",
      createdAt: new Date(now - 55 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 7 * 24 * 3600000).toISOString(),
    },
    {
      id: 107,
      name: "Hue Imperial Stay",
      city: "Hue",
      address: "14 Le Loi, Hue",
      starRating: 3,
      avgRating: 3.9,
      reviewCount: 92,
      hostName: "Bui Thu Hien",
      hostEmail: "hien.host@example.com",
      status: "PENDING",
      createdAt: new Date(now - 5 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 1 * 24 * 3600000).toISOString(),
    },
    {
      id: 108,
      name: "Mekong Riverside Lodge",
      city: "Can Tho",
      address: "17 Hai Ba Trung, Ninh Kieu",
      starRating: 4,
      avgRating: 4.2,
      reviewCount: 188,
      hostName: "Nguyen Gia Han",
      hostEmail: "han.host@example.com",
      status: "APPROVED",
      createdAt: new Date(now - 48 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 10 * 24 * 3600000).toISOString(),
    },
  ]);
};

const filterHotels = (
  hotels,
  { search = "", status = "ALL", city = "ALL" },
) => {
  const searchTerm = String(search || "")
    .trim()
    .toLowerCase();
  const statusFilter = String(status || "ALL").toUpperCase();
  const cityFilter = String(city || "ALL").toUpperCase();

  return hotels.filter((hotel) => {
    const matchesSearch =
      !searchTerm ||
      hotel.name.toLowerCase().includes(searchTerm) ||
      hotel.hostName.toLowerCase().includes(searchTerm) ||
      hotel.hostEmail.toLowerCase().includes(searchTerm) ||
      hotel.address.toLowerCase().includes(searchTerm);

    const matchesStatus =
      statusFilter === "ALL" || hotel.status === statusFilter;
    const matchesCity =
      cityFilter === "ALL" || hotel.city.toUpperCase() === cityFilter;

    return matchesSearch && matchesStatus && matchesCity;
  });
};

const normalizeTours = (tours) => {
  return tours
    .map((tour) => {
      const createdAt =
        asDate(
          tour?.createdAt || tour?.created_at || tour?.createdDate,
        )?.toISOString() || null;
      const updatedAt =
        asDate(
          tour?.updatedAt || tour?.updated_at || tour?.updatedDate,
        )?.toISOString() || null;

      const seatsTotal = Number(
        tour?.seatsTotal || tour?.slot || tour?.capacity || 0,
      );
      const seatsBooked = Number(
        tour?.seatsBooked || tour?.booked || tour?.reserved || 0,
      );

      return {
        id: String(tour?.id || tour?.tourId || tour?.code || Math.random()),
        title: String(tour?.title || tour?.name || "Untitled Tour"),
        city: String(
          tour?.city || tour?.destination || tour?.province || "Unknown",
        ),
        location: String(
          tour?.location || tour?.meetingPoint || tour?.destination || "-",
        ),
        durationDays: Number(
          tour?.durationDays || tour?.duration || tour?.days || 1,
        ),
        priceFrom: Number(
          tour?.priceFrom || tour?.price || tour?.basePrice || 0,
        ),
        seatsTotal,
        seatsRemaining: Math.max(
          0,
          Number(tour?.seatsRemaining ?? seatsTotal - seatsBooked),
        ),
        operatorName: String(
          tour?.operatorName ||
            tour?.providerName ||
            tour?.hostName ||
            tour?.createdByName ||
            "Unknown Operator",
        ),
        operatorEmail: String(
          tour?.operatorEmail ||
            tour?.providerEmail ||
            tour?.hostEmail ||
            tour?.createdByEmail ||
            "-",
        ),
        status: normalizeTourStatus(
          tour?.status || tour?.approvalStatus,
          tour?.isActive,
        ),
        createdAt,
        updatedAt,
      };
    })
    .sort((a, b) => {
      const timeA = asDate(a.createdAt)?.getTime() || 0;
      const timeB = asDate(b.createdAt)?.getTime() || 0;
      return timeB - timeA;
    });
};

const createMockTours = () => {
  const now = Date.now();
  return normalizeTours([
    {
      id: 201,
      title: "Da Nang City Highlights",
      city: "Da Nang",
      location: "Dragon Bridge - Son Tra - Marble Mountain",
      durationDays: 1,
      priceFrom: 890000,
      seatsTotal: 30,
      seatsRemaining: 9,
      operatorName: "Skyline Travel",
      operatorEmail: "ops@skylinetravel.vn",
      status: "PENDING",
      createdAt: new Date(now - 5 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 1 * 24 * 3600000).toISOString(),
    },
    {
      id: 202,
      title: "Hoi An Lantern Night",
      city: "Hoi An",
      location: "Hoi An Old Town",
      durationDays: 1,
      priceFrom: 650000,
      seatsTotal: 24,
      seatsRemaining: 5,
      operatorName: "Lantern Tours",
      operatorEmail: "contact@lanterntours.vn",
      status: "APPROVED",
      createdAt: new Date(now - 28 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 4 * 24 * 3600000).toISOString(),
    },
    {
      id: 203,
      title: "Sapa Trekking 2N1D",
      city: "Lao Cai",
      location: "Cat Cat - Ta Van",
      durationDays: 2,
      priceFrom: 1890000,
      seatsTotal: 16,
      seatsRemaining: 12,
      operatorName: "Peak Route",
      operatorEmail: "hello@peakroute.vn",
      status: "REJECTED",
      createdAt: new Date(now - 18 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 12 * 24 * 3600000).toISOString(),
    },
    {
      id: 204,
      title: "Mekong Floating Market",
      city: "Can Tho",
      location: "Cai Rang Floating Market",
      durationDays: 1,
      priceFrom: 790000,
      seatsTotal: 20,
      seatsRemaining: 3,
      operatorName: "Mekong Adventure",
      operatorEmail: "ops@mekongadv.vn",
      status: "SUSPENDED",
      createdAt: new Date(now - 31 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 2 * 24 * 3600000).toISOString(),
    },
    {
      id: 205,
      title: "Ha Giang Loop Explorer",
      city: "Ha Giang",
      location: "Dong Van - Meo Vac",
      durationDays: 3,
      priceFrom: 3290000,
      seatsTotal: 12,
      seatsRemaining: 6,
      operatorName: "Northbound Co.",
      operatorEmail: "team@northbound.vn",
      status: "PENDING",
      createdAt: new Date(now - 7 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 1 * 24 * 3600000).toISOString(),
    },
    {
      id: 206,
      title: "Phu Quoc Island Escape",
      city: "Phu Quoc",
      location: "Hon Thom - Sao Beach",
      durationDays: 2,
      priceFrom: 2790000,
      seatsTotal: 28,
      seatsRemaining: 15,
      operatorName: "BlueWave Tours",
      operatorEmail: "booking@bluewave.vn",
      status: "APPROVED",
      createdAt: new Date(now - 21 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 3 * 24 * 3600000).toISOString(),
    },
    {
      id: 207,
      title: "Ninh Binh Heritage Day",
      city: "Ninh Binh",
      location: "Trang An - Bai Dinh",
      durationDays: 1,
      priceFrom: 990000,
      seatsTotal: 26,
      seatsRemaining: 8,
      operatorName: "Heritage Ride",
      operatorEmail: "contact@heritageride.vn",
      status: "PENDING",
      createdAt: new Date(now - 4 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 1 * 24 * 3600000).toISOString(),
    },
    {
      id: 208,
      title: "Hue Royal Discovery",
      city: "Hue",
      location: "Imperial City - Thien Mu Pagoda",
      durationDays: 1,
      priceFrom: 840000,
      seatsTotal: 18,
      seatsRemaining: 7,
      operatorName: "Royal Path Travel",
      operatorEmail: "ops@royalpath.vn",
      status: "APPROVED",
      createdAt: new Date(now - 16 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 5 * 24 * 3600000).toISOString(),
    },
  ]);
};

const filterTours = (
  tours,
  { search = "", status = "ALL", city = "ALL", operator = "ALL" },
) => {
  const searchTerm = String(search || "")
    .trim()
    .toLowerCase();
  const statusFilter = String(status || "ALL").toUpperCase();
  const cityFilter = String(city || "ALL").toUpperCase();
  const operatorFilter = String(operator || "ALL").toUpperCase();

  return tours.filter((tour) => {
    const matchesSearch =
      !searchTerm ||
      tour.title.toLowerCase().includes(searchTerm) ||
      tour.location.toLowerCase().includes(searchTerm) ||
      tour.operatorName.toLowerCase().includes(searchTerm) ||
      tour.operatorEmail.toLowerCase().includes(searchTerm);

    const matchesStatus =
      statusFilter === "ALL" || tour.status === statusFilter;
    const matchesCity =
      cityFilter === "ALL" || tour.city.toUpperCase() === cityFilter;
    const matchesOperator =
      operatorFilter === "ALL" ||
      tour.operatorName.toUpperCase() === operatorFilter;

    return matchesSearch && matchesStatus && matchesCity && matchesOperator;
  });
};

const normalizeAdminBookings = (bookings) => {
  return bookings
    .map((booking) => {
      const bookingType = bookingTypeOf(booking);
      const serviceName =
        booking?.serviceName ||
        booking?.hotelName ||
        booking?.tourName ||
        booking?.itemName ||
        (bookingType === "HOTEL" ? "Unknown Hotel" : "Unknown Tour");

      return {
        id: String(
          booking?.id ||
            booking?.bookingId ||
            booking?.bookingCode ||
            Math.random(),
        ),
        bookingCode: String(
          booking?.bookingCode || booking?.code || booking?.id || "N/A",
        ),
        bookingType,
        guestName: String(
          booking?.guestName ||
            booking?.userName ||
            booking?.customerName ||
            booking?.fullName ||
            booking?.email ||
            "Unknown",
        ),
        guestEmail: String(
          booking?.guestEmail || booking?.email || booking?.userEmail || "-",
        ),
        serviceName: String(serviceName),
        serviceCity: String(
          booking?.serviceCity ||
            booking?.city ||
            booking?.destination ||
            booking?.hotelCity ||
            booking?.tourCity ||
            "-",
        ),
        startDate:
          asDate(
            booking?.startDate ||
              booking?.checkIn ||
              booking?.departureDate ||
              booking?.tourDate,
          )?.toISOString() || null,
        endDate:
          asDate(
            booking?.endDate || booking?.checkOut || booking?.returnDate,
          )?.toISOString() || null,
        status: normalizeBookingWorkflowStatus(booking?.status),
        paymentStatus: normalizePaymentStatus(
          booking?.paymentStatus ||
            booking?.payment_status ||
            booking?.payment?.status,
        ),
        totalAmount: Number(
          booking?.totalAmount || booking?.amount || booking?.price || 0,
        ),
        currency: String(booking?.currency || "VND"),
        createdAt:
          asDate(
            booking?.createdAt || booking?.createdDate || booking?.created_time,
          )?.toISOString() || null,
        note: String(
          booking?.specialRequests || booking?.note || booking?.adminNote || "",
        ),
      };
    })
    .sort((a, b) => {
      const timeA = asDate(a.createdAt)?.getTime() || 0;
      const timeB = asDate(b.createdAt)?.getTime() || 0;
      return timeB - timeA;
    });
};

const createMockAdminBookings = () => {
  const now = Date.now();
  return normalizeAdminBookings([
    {
      id: 5001,
      bookingCode: "BK-HT-5001",
      bookingType: "HOTEL",
      guestName: "Nguyen Van An",
      guestEmail: "an.nguyen@example.com",
      hotelName: "Sea Light Da Nang Hotel",
      serviceCity: "Da Nang",
      checkIn: new Date(now + 2 * 24 * 3600000).toISOString(),
      checkOut: new Date(now + 4 * 24 * 3600000).toISOString(),
      status: "CONFIRMED",
      paymentStatus: "PAID",
      totalAmount: 3200000,
      currency: "VND",
      createdAt: new Date(now - 3 * 3600000).toISOString(),
      specialRequests: "Late check-in 22:00",
    },
    {
      id: 5002,
      bookingCode: "BK-TR-5002",
      bookingType: "TOUR",
      guestName: "Tran Bao Chau",
      guestEmail: "chau.tran@example.com",
      tourName: "Da Nang City Highlights",
      serviceCity: "Da Nang",
      startDate: new Date(now + 5 * 24 * 3600000).toISOString(),
      endDate: new Date(now + 5 * 24 * 3600000).toISOString(),
      status: "PENDING",
      paymentStatus: "PENDING",
      totalAmount: 1890000,
      currency: "VND",
      createdAt: new Date(now - 6 * 3600000).toISOString(),
      note: "Waiting payment confirmation",
    },
    {
      id: 5003,
      bookingCode: "BK-HT-5003",
      bookingType: "HOTEL",
      guestName: "Le Minh Khang",
      guestEmail: "khang.le@example.com",
      hotelName: "Hanoi Old Quarter Suites",
      serviceCity: "Ha Noi",
      checkIn: new Date(now - 3 * 24 * 3600000).toISOString(),
      checkOut: new Date(now - 1 * 24 * 3600000).toISOString(),
      status: "COMPLETED",
      paymentStatus: "PAID",
      totalAmount: 2780000,
      currency: "VND",
      createdAt: new Date(now - 30 * 3600000).toISOString(),
      specialRequests: "High floor",
    },
    {
      id: 5004,
      bookingCode: "BK-TR-5004",
      bookingType: "TOUR",
      guestName: "Do Thuy Linh",
      guestEmail: "linh.do@example.com",
      tourName: "Hoi An Lantern Night",
      serviceCity: "Hoi An",
      startDate: new Date(now + 1 * 24 * 3600000).toISOString(),
      endDate: new Date(now + 1 * 24 * 3600000).toISOString(),
      status: "CONFIRMED",
      paymentStatus: "PAID",
      totalAmount: 2450000,
      currency: "VND",
      createdAt: new Date(now - 38 * 3600000).toISOString(),
      note: "2 vegetarian meals",
    },
    {
      id: 5005,
      bookingCode: "BK-HT-5005",
      bookingType: "HOTEL",
      guestName: "Pham Quoc Huy",
      guestEmail: "huy.pham@example.com",
      hotelName: "Saigon Central Boutique",
      serviceCity: "Ho Chi Minh",
      checkIn: new Date(now + 7 * 24 * 3600000).toISOString(),
      checkOut: new Date(now + 9 * 24 * 3600000).toISOString(),
      status: "PENDING",
      paymentStatus: "FAILED",
      totalAmount: 1560000,
      currency: "VND",
      createdAt: new Date(now - 42 * 3600000).toISOString(),
      note: "Payment retry needed",
    },
    {
      id: 5006,
      bookingCode: "BK-TR-5006",
      bookingType: "TOUR",
      guestName: "Hoang Gia Bao",
      guestEmail: "bao.hoang@example.com",
      tourName: "Hue Royal Discovery",
      serviceCity: "Hue",
      startDate: new Date(now + 12 * 24 * 3600000).toISOString(),
      endDate: new Date(now + 12 * 24 * 3600000).toISOString(),
      status: "CANCELLED",
      paymentStatus: "REFUNDED",
      totalAmount: 990000,
      currency: "VND",
      createdAt: new Date(now - 55 * 3600000).toISOString(),
      note: "Refund completed",
    },
    {
      id: 5007,
      bookingCode: "BK-HT-5007",
      bookingType: "HOTEL",
      guestName: "Vu Minh Tri",
      guestEmail: "tri.vu@example.com",
      hotelName: "Mekong Riverside Lodge",
      serviceCity: "Can Tho",
      checkIn: new Date(now + 4 * 24 * 3600000).toISOString(),
      checkOut: new Date(now + 5 * 24 * 3600000).toISOString(),
      status: "CONFIRMED",
      paymentStatus: "PAID",
      totalAmount: 1420000,
      currency: "VND",
      createdAt: new Date(now - 61 * 3600000).toISOString(),
      note: "Child-friendly room",
    },
    {
      id: 5008,
      bookingCode: "BK-TR-5008",
      bookingType: "TOUR",
      guestName: "Bui Lan Anh",
      guestEmail: "lananh.bui@example.com",
      tourName: "Phu Quoc Island Escape",
      serviceCity: "Phu Quoc",
      startDate: new Date(now + 10 * 24 * 3600000).toISOString(),
      endDate: new Date(now + 11 * 24 * 3600000).toISOString(),
      status: "PENDING",
      paymentStatus: "PENDING",
      totalAmount: 2790000,
      currency: "VND",
      createdAt: new Date(now - 72 * 3600000).toISOString(),
      note: "Awaiting operator confirmation",
    },
  ]);
};

const filterAdminBookings = (
  bookings,
  { search = "", status = "ALL", type = "ALL", paymentStatus = "ALL" },
) => {
  const searchTerm = String(search || "")
    .trim()
    .toLowerCase();
  const statusFilter = String(status || "ALL").toUpperCase();
  const typeFilter = String(type || "ALL").toUpperCase();
  const paymentFilter = String(paymentStatus || "ALL").toUpperCase();

  return bookings.filter((booking) => {
    const matchesSearch =
      !searchTerm ||
      booking.bookingCode.toLowerCase().includes(searchTerm) ||
      booking.guestName.toLowerCase().includes(searchTerm) ||
      booking.guestEmail.toLowerCase().includes(searchTerm) ||
      booking.serviceName.toLowerCase().includes(searchTerm);

    const matchesStatus =
      statusFilter === "ALL" || booking.status === statusFilter;
    const matchesType =
      typeFilter === "ALL" || booking.bookingType === typeFilter;
    const matchesPayment =
      paymentFilter === "ALL" || booking.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesType && matchesPayment;
  });
};

const normalizePromotions = (promotions) => {
  return promotions
    .map((promotion) => ({
      id: String(
        promotion?.id ||
          promotion?.promotionId ||
          promotion?.code ||
          Math.random(),
      ),
      code: String(promotion?.code || "PROMO"),
      name: String(
        promotion?.name || promotion?.title || promotion?.code || "Promotion",
      ),
      description: String(promotion?.description || promotion?.title || ""),
      type: normalizePromotionType(promotion?.type || promotion?.discountType),
      value: Number(promotion?.value || promotion?.discountValue || 0),
      minOrderAmount: Number(
        promotion?.minOrderAmount || promotion?.minimumSpend || 0,
      ),
      maxDiscountAmount:
        promotion?.maxDiscountAmount == null
          ? null
          : Number(promotion?.maxDiscountAmount || promotion?.maxDiscount || 0),
      usageLimit: Number(promotion?.usageLimit || promotion?.quantity || 0),
      usedCount: Number(promotion?.usedCount || promotion?.used || 0),
      appliesTo: promotion?.appliesTo != null ? String(promotion.appliesTo) : null,
      startAt:
        asDate(
          promotion?.startAt || promotion?.startDate || promotion?.validFrom,
        )?.toISOString() || null,
      endAt:
        asDate(
          promotion?.endAt || promotion?.endDate || promotion?.validTo,
        )?.toISOString() || null,
      isActive: Boolean(promotion?.isActive ?? promotion?.active ?? true),
      createdAt:
        asDate(
          promotion?.createdAt ||
            promotion?.createdDate ||
            promotion?.created_time,
        )?.toISOString() || null,
      updatedAt:
        asDate(
          promotion?.updatedAt ||
            promotion?.updatedDate ||
            promotion?.updated_time,
        )?.toISOString() || null,
    }))
    .sort((a, b) => {
      const timeA = asDate(a.updatedAt || a.createdAt)?.getTime() || 0;
      const timeB = asDate(b.updatedAt || b.createdAt)?.getTime() || 0;
      return timeB - timeA;
    });
};

const normalizeAuditLogs = (auditLogs) => {
  return auditLogs
    .map((log) => ({
      id: String(log?.id || Math.random()),
      actorId: log?.actorId == null ? null : String(log.actorId),
      actorEmail: String(log?.actorEmail || log?.actor?.email || "system"),
      action: String(log?.action || "UNKNOWN").toUpperCase(),
      resource: String(
        log?.resource || log?.resourceType || "UNKNOWN",
      ).toUpperCase(),
      resourceId: log?.resourceId == null ? null : String(log.resourceId),
      beforeData: String(log?.beforeData || log?.oldValue || ""),
      afterData: String(log?.afterData || log?.newValue || ""),
      reason: String(log?.reason || ""),
      timestamp:
        asDate(
          log?.timestamp || log?.createdAt || log?.created_time,
        )?.toISOString() || null,
    }))
    .sort((a, b) => {
      const timeA = asDate(a.timestamp)?.getTime() || 0;
      const timeB = asDate(b.timestamp)?.getTime() || 0;
      return timeB - timeA;
    });
};

const createMockPromotions = () => {
  const now = Date.now();
  return normalizePromotions([
    {
      id: 9001,
      code: "SUMMER25",
      description: "Giam 25% toi da 300k cho tour mua he",
      type: "PERCENT",
      value: 25,
      minOrderAmount: 1200000,
      maxDiscountAmount: 300000,
      usageLimit: 600,
      usedCount: 189,
      startAt: new Date(now - 2 * 24 * 3600000).toISOString(),
      endAt: new Date(now + 20 * 24 * 3600000).toISOString(),
      isActive: true,
      createdAt: new Date(now - 9 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 1 * 24 * 3600000).toISOString(),
    },
    {
      id: 9002,
      code: "HOTEL150K",
      description: "Giam truc tiep 150k cho booking hotel",
      type: "FIXED",
      value: 150000,
      minOrderAmount: 1000000,
      maxDiscountAmount: null,
      usageLimit: 300,
      usedCount: 72,
      startAt: new Date(now - 12 * 24 * 3600000).toISOString(),
      endAt: new Date(now + 15 * 24 * 3600000).toISOString(),
      isActive: true,
      createdAt: new Date(now - 20 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 2 * 24 * 3600000).toISOString(),
    },
    {
      id: 9003,
      code: "EARLYBIRD15",
      description: "Dat som tiet kiem 15%",
      type: "PERCENT",
      value: 15,
      minOrderAmount: 800000,
      maxDiscountAmount: 250000,
      usageLimit: 500,
      usedCount: 56,
      startAt: new Date(now + 5 * 24 * 3600000).toISOString(),
      endAt: new Date(now + 45 * 24 * 3600000).toISOString(),
      isActive: true,
      createdAt: new Date(now - 4 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 4 * 24 * 3600000).toISOString(),
    },
    {
      id: 9004,
      code: "WELCOME100",
      description: "Voucher chao mung nguoi dung moi",
      type: "FIXED",
      value: 100000,
      minOrderAmount: 500000,
      maxDiscountAmount: null,
      usageLimit: 1000,
      usedCount: 1000,
      startAt: new Date(now - 40 * 24 * 3600000).toISOString(),
      endAt: new Date(now - 2 * 24 * 3600000).toISOString(),
      isActive: true,
      createdAt: new Date(now - 60 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 3 * 24 * 3600000).toISOString(),
    },
    {
      id: 9005,
      code: "FLASH10",
      description: "Flash sale 10%",
      type: "PERCENT",
      value: 10,
      minOrderAmount: 600000,
      maxDiscountAmount: 150000,
      usageLimit: 200,
      usedCount: 12,
      startAt: new Date(now - 1 * 24 * 3600000).toISOString(),
      endAt: new Date(now + 2 * 24 * 3600000).toISOString(),
      isActive: false,
      createdAt: new Date(now - 2 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 8 * 3600000).toISOString(),
    },
  ]);
};

const filterPromotions = (
  promotions,
  { search = "", status = "ALL", type = "ALL" },
) => {
  const searchTerm = String(search || "")
    .trim()
    .toLowerCase();
  const statusFilter = String(status || "ALL").toUpperCase();
  const typeFilter = String(type || "ALL").toUpperCase();

  return promotions.filter((promotion) => {
    const lifecycle = promotionLifecycleStatusOf(promotion);

    const matchesSearch =
      !searchTerm ||
      promotion.code.toLowerCase().includes(searchTerm) ||
      promotion.description.toLowerCase().includes(searchTerm);

    const matchesStatus = statusFilter === "ALL" || lifecycle === statusFilter;
    const matchesType = typeFilter === "ALL" || promotion.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });
};

const paginateItems = (items, page = 1, limit = 10) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 10);
  const start = (safePage - 1) * safeLimit;
  const end = start + safeLimit;
  return items.slice(start, end);
};

const paginateUsers = (users, page = 1, limit = 10) => {
  return paginateItems(users, page, limit);
};

// Keep legacy mock helpers exported to avoid breaking existing admin test utilities.
void [
  createMockBookings,
  createMockUsers,
  filterUsers,
  createMockHotels,
  filterHotels,
  createMockTours,
  filterTours,
  createMockAdminBookings,
  filterAdminBookings,
  createMockPromotions,
  filterPromotions,
  paginateUsers,
];

const normalizeError = (error, fallbackMessage) => {
  const payload = error?.data;
  const fieldErrors = payload?.errors;
  const fieldMessage =
    fieldErrors && typeof fieldErrors === "object"
      ? Object.values(fieldErrors).filter(Boolean).join(". ")
      : "";

  const message =
    fieldMessage ||
    payload?.message ||
    error?.message ||
    fallbackMessage ||
    "Request failed";

  const normalized = new Error(String(message));
  normalized.name = "ApiError";
  return normalized;
};

const safeRequest = async (request, fallbackMessage) => {
  try {
    return await request();
  } catch (error) {
    throw normalizeError(error, fallbackMessage);
  }
};

const DASHBOARD_CACHE_TTL_MS = 30000;
let dashboardCache = {
  fetchedAt: 0,
  data: null,
};

const toAdminOverview = (
  response,
  key,
  fallbackPage = 1,
  fallbackSize = 10,
) => {
  const list = extractList(response);
  const paging = extractPaging(
    response,
    fallbackPage,
    fallbackSize,
    list.length,
  );

  return {
    [key]: list,
    meta: {
      total: paging.total,
      page: paging.page,
      size: paging.size,
    },
    dataMode: "live",
    hasMockFallback: false,
  };
};

const adminApi = {
  getDashboardOverview: async ({ force = false } = {}) => {
    const now = Date.now();
    if (
      !force &&
      dashboardCache.data &&
      now - dashboardCache.fetchedAt < DASHBOARD_CACHE_TTL_MS
    ) {
      return dashboardCache.data;
    }

    let data;

    try {
      const statsResponse = await axiosClient.get("/admin/statistics/dashboard");
      const stats = statsResponse?.data || {};

      const revenueByMonth = Array.isArray(stats.revenueByMonth) ? stats.revenueByMonth : [];
      const revenueSeries = revenueByMonth.map((item) => {
        const monthMap = {
          "01": "T1", "02": "T2", "03": "T3", "04": "T4",
          "05": "T5", "06": "T6", "07": "T7", "08": "T8",
          "09": "T9", "10": "T10", "11": "T11", "12": "T12",
        };
        const monthKey = String(item.month || "");
        const parts = monthKey.split("-");
        const label = parts.length === 2
          ? `${monthMap[parts[1]] || parts[1]}/${parts[0].slice(2)}`
          : monthKey;

        return {
          key: item.month || label,
          label,
          value: Number(item.revenue || 0),
        };
      });

      const recentBookingsRaw = Array.isArray(stats.recentBookings) ? stats.recentBookings : [];
      const recentBookings = recentBookingsRaw.map((b) => ({
        bookingCode: b.booking_code || b.bookingCode || "",
        bookingType: b.booking_type || b.bookingType || "",
        guestName: b.user_name || b.guestName || b.userName || "",
        createdAt: b.created_at || b.createdAt || null,
        status: b.status || "",
        totalAmount: Number(b.total_amount || b.totalAmount || 0),
        currency: "VND",
      }));

      data = {
        stats: {
          totalRevenue: Number(stats.totalRevenue || 0),
          bookingsToday: 0,
          hotelCount: Number(stats.totalHotels || 0),
          tourCount: Number(stats.totalTours || 0),
          totalUsers: Number(stats.totalUsers || 0),
          totalBookings: Number(stats.totalBookings || 0),
          totalReviews: Number(stats.totalReviews || 0),
          pendingReviews: Number(stats.pendingReviews || 0),
          pendingHotels: Number(stats.pendingHotels || 0),
          pendingTours: Number(stats.pendingTours || 0),
          monthlyRevenue: Number(stats.monthlyRevenue || 0),
        },
        revenueSeries,
        recentBookings,
        topDestinations: Array.isArray(stats.topDestinations) ? stats.topDestinations : [],
        bookingsByMonth: Array.isArray(stats.bookingsByMonth) ? stats.bookingsByMonth : [],
        dataMode: "live",
        hasMockFallback: false,
      };
    } catch {
      data = {
        stats: {
          totalRevenue: 0,
          bookingsToday: 0,
          hotelCount: 0,
          tourCount: 0,
        },
        revenueSeries: [],
        recentBookings: [],
        dataMode: "live",
        hasMockFallback: false,
      };
    }

    dashboardCache = {
      fetchedAt: Date.now(),
      data,
    };

    return data;
  },

  getAdminUsers: async ({
    search = "",
    role = "ALL",
    status = "ALL",
    page = 1,
    limit = 10,
  } = {}) => {
    const response = await safeRequest(
      () =>
        axiosClient.get("/admin/users", {
          params: { search, role, status, page, limit },
        }),
      "Khong the tai danh sach users.",
    );

    const overview = toAdminOverview(response, "users", page, limit);
    return {
      ...overview,
      users: normalizeUsers(overview.users),
    };
  },

  updateUserRole: async (userId, role, reason) => {
    const payload = {
      role: normalizeRole(role),
      reason: String(reason || "").trim(),
    };

    return safeRequest(
      () => axiosClient.patch(`/admin/users/${userId}/role`, payload),
      "Cap nhat role user that bai.",
    );
  },

  updateUserStatus: async (userId, status, reason) => {
    const payload = {
      status: normalizeStatus(status),
      reason: String(reason || "").trim(),
    };

    return safeRequest(
      () => axiosClient.patch(`/admin/users/${userId}/status`, payload),
      "Cap nhat status user that bai.",
    );
  },

  getAdminHotels: async ({
    search = "",
    status = "ALL",
    city = "ALL",
    page = 1,
    limit = 8,
  } = {}) => {
    const response = await safeRequest(
      () =>
        axiosClient.get("/admin/hotels", {
          params: { search, status, city, page, limit },
        }),
      "Khong the tai danh sach hotels.",
    );

    const overview = toAdminOverview(response, "hotels", page, limit);
    return {
      ...overview,
      hotels: normalizeHotels(overview.hotels),
    };
  },

  updateHotelStatus: async (hotelId, status, reason) => {
    const payload = {
      status: normalizeHotelStatus(status),
      reason: String(reason || "").trim(),
    };

    return safeRequest(
      () => axiosClient.patch(`/admin/hotels/${hotelId}/status`, payload),
      "Cap nhat trang thai hotel that bai.",
    );
  },

  getAdminTours: async ({
    search = "",
    status = "ALL",
    city = "ALL",
    operator = "ALL",
    page = 1,
    limit = 8,
  } = {}) => {
    const response = await safeRequest(
      () =>
        axiosClient.get("/admin/tours", {
          params: { search, status, city, operator, page, limit },
        }),
      "Khong the tai danh sach tours.",
    );

    const overview = toAdminOverview(response, "tours", page, limit);
    return {
      ...overview,
      tours: normalizeTours(overview.tours),
    };
  },

  updateTourStatus: async (tourId, status, reason) => {
    const payload = {
      status: normalizeTourStatus(status),
      reason: String(reason || "").trim(),
    };

    return safeRequest(
      () => axiosClient.patch(`/admin/tours/${tourId}/status`, payload),
      "Cap nhat trang thai tour that bai.",
    );
  },

  getAdminBookings: async ({
    search = "",
    status = "ALL",
    type = "ALL",
    paymentStatus = "ALL",
    page = 1,
    limit = 10,
  } = {}) => {
    const response = await safeRequest(
      () =>
        axiosClient.get("/admin/bookings", {
          params: { search, status, type, paymentStatus, page, limit },
        }),
      "Khong the tai danh sach bookings.",
    );

    const overview = toAdminOverview(response, "bookings", page, limit);
    return {
      ...overview,
      bookings: normalizeAdminBookings(overview.bookings),
    };
  },

  updateBookingStatus: async (bookingId, status, reason) => {
    const payload = {
      status: normalizeBookingWorkflowStatus(status),
      reason: String(reason || "").trim(),
    };

    dashboardCache = {
      fetchedAt: 0,
      data: null,
    };

    return safeRequest(
      () => axiosClient.patch(`/admin/bookings/${bookingId}/status`, payload),
      "Cap nhat trang thai booking that bai.",
    );
  },

  getAdminPromotions: async ({
    search = "",
    status = "ALL",
    type = "ALL",
    page = 1,
    limit = 10,
  } = {}) => {
    const response = await safeRequest(
      () =>
        axiosClient.get("/admin/promotions", {
          params: { search, status, type, page, limit },
        }),
      "Khong the tai danh sach promotions.",
    );

    const overview = toAdminOverview(response, "promotions", page, limit);
    return {
      ...overview,
      promotions: normalizePromotions(overview.promotions),
    };
  },

  getAdminAuditLogs: async ({
    search = "",
    action = "ALL",
    resource = "ALL",
    page = 1,
    limit = 12,
  } = {}) => {
    const response = await safeRequest(
      () =>
        axiosClient.get("/admin/audit-logs", {
          params: { q: search, action, resource, page, limit },
        }),
      "Khong the tai audit logs.",
    );

    const overview = toAdminOverview(response, "auditLogs", page, limit);
    return {
      ...overview,
      auditLogs: normalizeAuditLogs(overview.auditLogs),
    };
  },

  createAdminPromotion: async (payload) => {
    return safeRequest(
      () => axiosClient.post("/admin/promotions", payload),
      "Tao promotion that bai.",
    );
  },

  updateAdminPromotion: async (promotionId, payload) => {
    return safeRequest(
      () => axiosClient.patch(`/admin/promotions/${promotionId}`, payload),
      "Cap nhat promotion that bai.",
    );
  },

  updateAdminPromotionStatus: async (promotionId, isActive, reason) => {
    return safeRequest(
      () =>
        axiosClient.patch(`/admin/promotions/${promotionId}/status`, {
          isActive: Boolean(isActive),
          reason: String(reason || "").trim(),
        }),
      "Cap nhat trang thai promotion that bai.",
    );
  },

  deleteAdminPromotion: async (promotionId, reason) => {
    return safeRequest(
      () =>
        axiosClient.delete(`/admin/promotions/${promotionId}`, {
          data: {
            reason: String(reason || "").trim(),
          },
        }),
      "Xoa promotion that bai.",
    );
  },

  // ===================== HOTEL CRUD =====================

  getHotelById: async (hotelId) => {
    const response = await safeRequest(
      () => axiosClient.get(`/admin/hotels/${hotelId}`),
      "Khong the tai chi tiet hotel.",
    );
    return response?.data?.result || response?.data;
  },

  createHotel: async (payload) => {
    return safeRequest(
      () => axiosClient.post("/admin/hotels", payload),
      "Tao hotel that bai.",
    );
  },

  updateHotel: async (hotelId, payload) => {
    return safeRequest(
      () => axiosClient.put(`/admin/hotels/${hotelId}`, payload),
      "Cap nhat hotel that bai.",
    );
  },

  // ===================== TOUR CRUD =====================

  getTourById: async (tourId) => {
    const response = await safeRequest(
      () => axiosClient.get(`/admin/tours/${tourId}`),
      "Khong the tai chi tiet tour.",
    );
    return response?.data?.result || response?.data;
  },

  createTour: async (payload) => {
    return safeRequest(
      () => axiosClient.post("/admin/tours", payload),
      "Tao tour that bai.",
    );
  },

  updateTour: async (tourId, payload) => {
    return safeRequest(
      () => axiosClient.put(`/admin/tours/${tourId}`, payload),
      "Cap nhat tour that bai.",
    );
  },

  // ===================== REVIEW MODERATION =====================

  /**
   * @param {{ page?: number, size?: number, status?: string, targetType?: string }} options
   */
  getReviews: async ({ page = 0, size = 20, status, targetType } = {}) => {
    const params = { page, size };
    if (status) params.status = status;
    if (targetType) params.targetType = targetType;
    return safeRequest(
      () => axiosClient.get('/admin/reviews', { params }),
      "Khong the tai danh sach reviews.",
    );
  },

  getReviewById: async (id) => {
    return safeRequest(
      () => axiosClient.get(`/admin/reviews/${id}`),
      "Khong the tai chi tiet review.",
    );
  },

  approveReview: async (id) => {
    return safeRequest(
      () => axiosClient.patch(`/admin/reviews/${id}/approve`),
      "Duyet review that bai.",
    );
  },

  rejectReview: async (id) => {
    return safeRequest(
      () => axiosClient.patch(`/admin/reviews/${id}/reject`),
      "Tu choi review that bai.",
    );
  },

  replyToReview: async (id, reply) => {
    return safeRequest(
      () => axiosClient.post(`/admin/reviews/${id}/reply`, { reply }),
      "Phan hoi review that bai.",
    );
  },

  deleteReview: async (id) => {
    return safeRequest(
      () => axiosClient.delete(`/admin/reviews/${id}`),
      "Xoa review that bai.",
    );
  },

  getReviewCounts: async () => {
    return safeRequest(
      () => axiosClient.get('/admin/reviews/counts'),
      "Khong the tai so lieu review.",
    );
  },

  // Hotel Import from CSV
  importHotelsParse: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return safeRequest(
      () => axiosClient.post('/admin/hotels/import/parse', formData),
      "Parse CSV that bai.",
    );
  },

  importHotelsPreview: async (request) => {
    return safeRequest(
      () => axiosClient.post('/admin/hotels/import/preview', request),
      "Preview import that bai.",
    );
  },

  importHotelsExecute: async (request) => {
    return safeRequest(
      () => axiosClient.post('/admin/hotels/import/execute', request),
      "Import hotels that bai.",
    );
  },

  // Map endpoints
  getHotelsForMap: async ({ city = 'ALL', status = 'ALL', limit = 500 } = {}) => {
    return safeRequest(
      () => axiosClient.get('/admin/hotels/map', { params: { city, status, limit } }),
      "Khong the tai du lieu ban do.",
    );
  },

  getCitiesWithHotels: async () => {
    return safeRequest(
      () => axiosClient.get('/admin/hotels/map/cities'),
      "Khong the tai danh sach thanh pho.",
    );
  },

  // ===================== COMBO CRUD =====================
  getAdminCombos: async ({
    search = '',
    status = 'ALL',
    type = 'ALL',
    page = 1,
    limit = 10,
  } = {}) => {
    const response = await safeRequest(
      () =>
        axiosClient.get('/admin/combos', {
          params: { q: search, status, type, page, size: limit },
        }),
      'Khong the tai danh sach combos.',
    );
    return response?.data?.result || response?.data || response;
  },

  getComboById: async (comboId) => {
    const response = await safeRequest(
      () => axiosClient.get(`/admin/combos/${comboId}`),
      'Khong the tai chi tiet combo.',
    );
    return response?.data?.result || response?.data || response;
  },

  createAdminCombo: async (payload) => {
    return safeRequest(
      () => axiosClient.post('/admin/combos', payload),
      'Tao combo that bai.',
    );
  },

  updateAdminCombo: async (comboId, payload) => {
    return safeRequest(
      () => axiosClient.put(`/admin/combos/${comboId}`, payload),
      'Cap nhat combo that bai.',
    );
  },

  updateAdminComboStatus: async (comboId, isActive, reason) => {
    return safeRequest(
      () =>
        axiosClient.patch(`/admin/combos/${comboId}/status`, {
          isActive: Boolean(isActive),
          reason: String(reason || '').trim(),
        }),
      'Cap nhat trang thai combo that bai.',
    );
  },

  deleteAdminCombo: async (comboId, reason) => {
    return safeRequest(
      () =>
        axiosClient.delete(`/admin/combos/${comboId}`, {
          data: {
            reason: String(reason || '').trim(),
          },
        }),
      'Xoa combo that bai.',
    );
  },
};

export default adminApi;
