'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
    FaStar, FaMapMarkerAlt, FaWifi, FaParking, FaUtensils,
    FaDumbbell, FaBath, FaConciergeBell, FaCoffee,
    FaChevronDown, FaHeart, FaArrowLeft, FaBed, FaWalking, FaBus, FaRegCalendarAlt, FaCheckCircle, FaThumbsUp
} from 'react-icons/fa';
import { MdOutlinePool } from 'react-icons/md';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ClientChatModal from '@/components/Chat/ClientChatModal';
import InlineFaqChat from '@/components/Chat/InlineFaqChat';
import PriceCalendar from '@/components/Hotels/PriceCalendar/PriceCalendar';
import ShareButtons from '@/components/Common/ShareButtons/ShareButtons';
import HotelMap from '@/components/Hotels/HotelMap/HotelMap';
import AvailabilityBadge from '@/components/Hotels/AvailabilityBadge/AvailabilityBadge';
import hotelApi from '@/api/hotelApi';
import tourApi from '@/api/tourApi';
import pricingApi from '@/api/pricingApi';
import favoriteApi from '@/api/favoriteApi';
import styles from './page.module.css';

const TABS = ['Chi tiết', 'Thông tin & Giá', 'Phòng & Giường', 'Nội quy'];
const DEFAULT_TAB_INDEX = 2;
const REVIEW_PAGE_SIZE = 4;

const AMENITIES = [
    { icon: <FaWifi />, label: 'Wifi miễn phí' },
    { icon: <FaParking />, label: 'Bãi đỗ xe' },
    { icon: <FaUtensils />, label: 'Nhà hàng' },
    { icon: <FaDumbbell />, label: 'Phòng gym' },
    { icon: <FaBath />, label: 'Phòng tắm' },
    { icon: <FaConciergeBell />, label: 'Dịch vụ phòng' },
    { icon: <MdOutlinePool />, label: 'Hồ bơi' },
    { icon: <FaCoffee />, label: 'Máy pha trà/cà phê' },
];

const FAQS = [
    { q: 'Tôi thanh toán như thế nào và khi nào?', a: 'Bạn có thể thanh toán tại khách sạn hoặc qua cổng thanh toán trực tuyến an toàn của chúng tôi khi đặt phòng.' },
    { q: 'Đây có phải là khu vực không hút thuốc không?', a: 'Đây là khu vực cấm hút thuốc 100%. Khu vực hút thuốc ngoài trời được bố trí theo quy định.' },
    { q: 'Bữa sáng có được bao gồm không?', a: 'Bữa sáng được bao gồm cho một số loại phòng. Vui lòng kiểm tra chi tiết phòng trước khi đặt.' },
];

const GALLERY_FALLBACKS = [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80',
];

const formatVND = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price || 0));

const getRatingLabel = (r) => {
    if (r >= 9) return 'Tuyệt vời';
    if (r >= 8) return 'Rất tốt';
    if (r >= 7) return 'Tốt';
    return 'Ổn';
};

const normalizeText = (value) =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();

const formatDateVi = (dateString) => {
    if (!dateString) return 'Lịch khởi hành cập nhật sau';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Lịch khởi hành cập nhật sau';
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
};

const toDateInput = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getTodayDate = () => toDateInput(new Date());

const getTomorrowDate = () => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    return toDateInput(nextDate);
};

const DIRECT_VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|avi|mkv)(\?|#|$)/i;
const YOUTUBE_URL_RE = /(youtube\.com|youtu\.be|vimeo\.com)/i;
const MAX_REVIEW_MEDIA_FILES = 5;
const MAX_REVIEW_MEDIA_FILE_SIZE = 25 * 1024 * 1024;
const REVIEW_MEDIA_ACCEPT = 'image/*,video/*';

const isDirectVideoUrl = (url) => DIRECT_VIDEO_EXT_RE.test(String(url || ''));
const isLikelyVideoUrl = (url) => isDirectVideoUrl(url) || YOUTUBE_URL_RE.test(String(url || ''));

const formatRelativeWeeks = (dateString) => {
    if (!dateString) return 'Đánh giá gần đây';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Đánh giá gần đây';

    const now = new Date();
    const diffDays = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86400000));
    const weeks = Math.max(1, Math.round(diffDays / 7));
    return `Đánh giá cách đây ${weeks} tuần`;
};

const mapReviewItem = (item, index) => {
    const userName = item?.userName || item?.authorName || `Du khách ${index + 1}`;
    const rawRating = Number(item?.overallRating ?? item?.rating ?? 0);
    const safeRating = Number.isFinite(rawRating) ? Math.max(0, Math.min(10, rawRating > 10 ? rawRating / 2 : rawRating)) : 0;
    const mediaUrls = Array.isArray(item?.mediaUrls)
        ? item.mediaUrls
            .filter((url) => typeof url === 'string' && url.trim())
            .map((url) => url.trim())
        : [];
    const videoUrls = mediaUrls.filter(isLikelyVideoUrl);
    const imageUrls = mediaUrls.filter((url) => !isLikelyVideoUrl(url));

    return {
        id: item?.id || `review-${index}`,
        userName,
        initials: userName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('') || 'U',
        rating: safeRating,
        comment: item?.comment || item?.content || 'Khách hàng chưa để lại nội dung chi tiết cho đánh giá này.',
        createdAt: item?.createdAt || null,
        helpfulCount: Number(item?.helpfulCount || 0),
        verified: Boolean(item?.verified),
        imageUrls,
        videoUrls,
    };
};

const formatFileSize = (bytes) => {
    const value = Number(bytes || 0);
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const getReviewFileKey = (file, index) => (
    `${file.name}-${file.size}-${file.lastModified}-${index}`
);

const getNearbyData = (hotel) => {
    const city = String(hotel?.city || '').toLowerCase();

    const byCity = {
        'da nang': [
            { name: 'Cầu Rồng', type: 'Địa điểm biểu tượng', distanceKm: 1.6, walkMin: 18, driveMin: 6 },
            { name: 'Bảo tàng Điêu Khắc Chăm', type: 'Văn hóa', distanceKm: 1.2, walkMin: 14, driveMin: 5 },
            { name: 'Chợ Hàn', type: 'Mua sắm', distanceKm: 1.9, walkMin: 22, driveMin: 8 },
            { name: 'Công viên APEC', type: 'Giải trí', distanceKm: 1.7, walkMin: 20, driveMin: 7 },
        ],
        'ha noi': [
            { name: 'Hồ Gươm', type: 'Tham quan', distanceKm: 2.1, walkMin: 25, driveMin: 10 },
            { name: 'Phố cổ Hà Nội', type: 'Văn hóa', distanceKm: 2.6, walkMin: 31, driveMin: 12 },
            { name: 'Nhà hát Lớn', type: 'Kiến trúc', distanceKm: 2.3, walkMin: 27, driveMin: 11 },
            { name: 'Tràng Tiền Plaza', type: 'Mua sắm', distanceKm: 2.4, walkMin: 29, driveMin: 10 },
        ],
        'ho chi minh': [
            { name: 'Chợ Bến Thành', type: 'Mua sắm', distanceKm: 1.8, walkMin: 21, driveMin: 8 },
            { name: 'Phố đi bộ Nguyễn Huệ', type: 'Giải trí', distanceKm: 2.2, walkMin: 26, driveMin: 10 },
            { name: 'Nhà thờ Đức Bà', type: 'Kiến trúc', distanceKm: 2.5, walkMin: 30, driveMin: 11 },
            { name: 'Bảo tàng Mỹ thuật', type: 'Văn hóa', distanceKm: 1.9, walkMin: 22, driveMin: 9 },
        ],
    };

    const defaultPois = [
        { name: 'Trung tâm thành phố', type: 'Trung tâm giao thông', distanceKm: 2.0, walkMin: 24, driveMin: 9 },
        { name: 'Khu ẩm thực địa phương', type: 'Ẩm thực', distanceKm: 1.3, walkMin: 15, driveMin: 6 },
        { name: 'Điểm check-in nổi bật', type: 'Giải trí', distanceKm: 2.7, walkMin: 33, driveMin: 12 },
        { name: 'Khu mua sắm', type: 'Mua sắm', distanceKm: 2.2, walkMin: 26, driveMin: 10 },
    ];

    const pois = Object.entries(byCity).find(([key]) => city.includes(key))?.[1] || defaultPois;

    const highlightTags = [
        'Gần trung tâm giao thông',
        'Thuận tiện vui chơi giải trí',
        'Nhiều nhà hàng đặc sản quanh khu vực',
        'Dễ dàng di chuyển đến điểm check-in',
    ];

    return { pois, highlightTags };
};

const getRoomOffers = (room, nights, roomCount) => {
    if (!room) return [];

    const basePrice = Number(room.basePricePerNight || 0);
    const subtotal = basePrice * Math.max(1, Number(nights || 1)) * Math.max(1, Number(roomCount || 1));
    const promoPercent = basePrice >= 2000000 ? 15 : basePrice >= 1200000 ? 12 : 10;
    const promoValue = Math.round((subtotal * promoPercent) / 100);

    return [
        {
            code: `FLEX-${room.id}`,
            title: 'Hủy miễn phí trước check-in 48h',
            detail: `Áp dụng cho ${room.name}. Hoàn tiền 100% nếu hủy đúng hạn.`,
            badge: 'Linh hoạt',
        },
        {
            code: `BKFAST-${room.id}`,
            title: `Bao gồm bữa sáng cho tối đa ${Math.max(1, Number(room.capacity || 1))} khách`,
            detail: 'Buffet sáng tại nhà hàng khách sạn từ 06:30 - 10:00.',
            badge: 'Ăn sáng',
        },
        {
            code: `SAVE-${room.id}`,
            title: `Tiết kiệm ${promoPercent}% khi đặt ${Math.max(1, Number(nights || 1))} đêm`,
            detail: `Tổng ưu đãi ước tính: ${formatVND(promoValue)} (chưa tính khuyến mãi ngân hàng).`,
            badge: 'Ưu đãi',
        },
        {
            code: `PAYLATER-${room.id}`,
            title: 'Đặt trước, thanh toán sau tại khách sạn',
            detail: 'Không cần thanh toán toàn bộ ngày lúc đặt, giữ chỗ đến giờ check-in.',
            badge: 'Thanh toán linh hoạt',
        },
    ];
};

// ── Inner component (uses useSearchParams) ──
function HotelDetailInner() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated } = useSelector((state) => state.auth);

    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(DEFAULT_TAB_INDEX);
    const [openFaq, setOpenFaq] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [nearbyTours, setNearbyTours] = useState([]);
    const [tourLoading, setTourLoading] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewPage, setReviewPage] = useState(1);
    const [hasMoreReviews, setHasMoreReviews] = useState(false);
    const [reviewLoadingMore, setReviewLoadingMore] = useState(false);
    const [reviewDraft, setReviewDraft] = useState({ rating: 5, comment: '' });
    const [reviewFiles, setReviewFiles] = useState([]);
    const [reviewFilePreviews, setReviewFilePreviews] = useState([]);
    const [reviewFileInputKey, setReviewFileInputKey] = useState(0);
    const [reviewSubmitState, setReviewSubmitState] = useState({
        loading: false,
        error: '',
        success: '',
    });
    const [recommendedHotels, setRecommendedHotels] = useState([]);
    const [recommendedHotelsLoading, setRecommendedHotelsLoading] = useState(false);
    const [chatModalOpen, setChatModalOpen] = useState(false);
    const [chatSeed, setChatSeed] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [helpfulMap, setHelpfulMap] = useState({});
    const [showCalendar, setShowCalendar] = useState(false);
    const [canReview, setCanReview] = useState(false);
    const [dynamicPrice, setDynamicPrice] = useState(null);
    const [priceLoading, setPriceLoading] = useState(false);

    const checkIn = searchParams.get('checkIn') || '';
    const checkOut = searchParams.get('checkOut') || '';
    const adults = searchParams.get('adults') || '2';
    const children = searchParams.get('children') || '0';
    const rooms = searchParams.get('rooms') || '1';

    const [calendarCheckIn, setCalendarCheckIn] = useState(checkIn || '');
    const [calendarCheckOut, setCalendarCheckOut] = useState(checkOut || '');

    const nights = checkIn && checkOut
        ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
        : 1;

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setLoading(true);
                const res = await hotelApi.getHotelDetail(id);
                const data = res?.data;
                setHotel(data);

                // Load selected room: from URL param first, else first room
                const urlRoomTypeId = Number(searchParams.get('roomTypeId') || 0);
                let initialRoom = null;
                if (urlRoomTypeId && data?.roomTypes?.length > 0) {
                    initialRoom = data.roomTypes.find((rt) => Number(rt.id) === urlRoomTypeId) || null;
                }
                if (!initialRoom && data?.roomTypes?.length > 0) {
                    initialRoom = data.roomTypes[0];
                }
                setSelectedRoom(initialRoom);
                if (initialRoom) {
                    // Sync URL param with selected room
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('roomTypeId', String(initialRoom.id));
                    router.replace(`/hotels/${id}?${params.toString()}`, { scroll: false });
                }
            } catch (err) {
                setError(err?.message || 'Không thể tải thông tin khách sạn.');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchDetail();
    }, [id]);

    // Fetch dynamic price when dates or selected room change
    useEffect(() => {
        const fetchDynamicPrice = async () => {
            if (!checkIn || !checkOut || !selectedRoom || !hotel?.id) {
                setDynamicPrice(null);
                return;
            }

            try {
                setPriceLoading(true);
                const numNights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000));
                let total = 0;
                const numRooms = Number(rooms || 1);

                for (let i = 0; i < numNights; i++) {
                    const d = new Date(checkIn);
                    d.setDate(d.getDate() + i);
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    try {
                        const res = await pricingApi.calculateHotelNightPrice(hotel.id, dateStr, Number(adults || 2));
                        const price = res?.data?.data?.finalPrice ?? res?.data?.finalPrice;
                        total += Number(price) || Number(selectedRoom.basePricePerNight);
                    } catch {
                        total += Number(selectedRoom.basePricePerNight);
                    }
                }

                setDynamicPrice(total * numRooms);
            } catch {
                setDynamicPrice(null);
            } finally {
                setPriceLoading(false);
            }
        };

        fetchDynamicPrice();
    }, [checkIn, checkOut, selectedRoom, hotel?.id, adults, rooms]);

    useEffect(() => {
        const fetchNearbyTours = async () => {
            if (!hotel?.city) {
                setNearbyTours([]);
                return;
            }

            try {
                setTourLoading(true);

                const city = String(hotel.city || '').trim();
                const cityNorm = normalizeText(city);
                const response = await tourApi.searchTours({ city, limit: 12 });
                const rawTours = Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response?.data?.content)
                        ? response.data.content
                        : [];

                const filtered = rawTours
                    .filter((tour) => normalizeText(tour?.city).includes(cityNorm))
                    .sort((a, b) => Number(b?.avgRating || 0) - Number(a?.avgRating || 0))
                    .slice(0, 4);

                setNearbyTours(filtered);
            } catch {
                setNearbyTours([]);
            } finally {
                setTourLoading(false);
            }
        };

        fetchNearbyTours();
    }, [hotel?.city]);

    useEffect(() => {
        const fetchRecommendedHotels = async () => {
            if (!hotel?.id || !hotel?.city) {
                setRecommendedHotels([]);
                return;
            }

            try {
                setRecommendedHotelsLoading(true);
                const safeCheckIn = checkIn || getTodayDate();
                const safeCheckOut = checkOut || getTomorrowDate();
                const city = String(hotel.city || '').trim();
                const currentHotelId = Number(hotel.id);
                const currentCityNorm = normalizeText(hotel.city);

                let list = [];

                // Strategy 1: search by city
                try {
                    const searchResponse = await hotelApi.searchHotels({
                        city,
                        checkIn: safeCheckIn,
                        checkOut: safeCheckOut,
                        adults: Number(adults || 2),
                        rooms: Number(rooms || 1),
                    });
                    const payload = searchResponse?.data;
                    list = Array.isArray(payload)
                        ? payload
                        : Array.isArray(payload?.content)
                            ? payload.content
                            : Array.isArray(payload?.items)
                                ? payload.items
                                : Array.isArray(payload?.hotels)
                                    ? payload.hotels
                                    : [];
                } catch {
                    list = [];
                }

                // Strategy 2: get all hotels if search returned nothing
                if (list.length === 0) {
                    try {
                        const fallbackResponse = await hotelApi.getHotels({ limit: 100 });
                        const payload = fallbackResponse?.data;
                        list = Array.isArray(payload)
                            ? payload
                            : Array.isArray(payload?.content)
                                ? payload.content
                                : Array.isArray(payload?.items)
                                    ? payload.items
                                    : Array.isArray(payload?.hotels)
                                        ? payload.hotels
                                        : [];
                    } catch {
                        list = [];
                    }
                }

                const sorted = list
                    .filter((item) => Number(item?.id || 0) !== currentHotelId)
                    .filter((item) => {
                        const itemCity = String(item?.city || '').trim();
                        if (!itemCity) return false;
                        return normalizeText(itemCity).includes(currentCityNorm);
                    })
                    .sort((a, b) => Number(b?.avgRating || 0) - Number(a?.avgRating || 0))
                    .slice(0, 6);

                setRecommendedHotels(sorted);
            } catch {
                setRecommendedHotels([]);
            } finally {
                setRecommendedHotelsLoading(false);
            }
        };

        fetchRecommendedHotels();
    }, [hotel?.id, hotel?.city, checkIn, checkOut, adults, rooms]);

    // Check if this hotel is favorited by the user (only when authenticated)
    useEffect(() => {
        if (!hotel?.id || !isAuthenticated) {
            return;
        }

        const checkFav = async () => {
            try {
                const result = await favoriteApi.checkFavorite('HOTEL', hotel.id);
                setIsFavorite(Boolean(result));
            } catch {
                setIsFavorite(false);
            }
        };

        checkFav();
    }, [hotel?.id, isAuthenticated]);

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            toast.info('Vui lòng đăng nhập để lưu vào danh sách yêu thích.');
            const redirect = typeof window !== 'undefined'
                ? `?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}` : '';
            router.push(`/login${redirect}`);
            return;
        }
        if (favoriteLoading || !hotel?.id) return;

        setFavoriteLoading(true);
        try {
            if (isFavorite) {
                await favoriteApi.removeFavorite('HOTEL', hotel.id);
                setIsFavorite(false);
                toast.success('Đã xóa khỏi danh sách yêu thích.');
            } else {
                await favoriteApi.addFavorite('HOTEL', hotel.id);
                setIsFavorite(true);
                toast.success('Đã thêm vào danh sách yêu thích!');
            }
        } catch (err) {
            toast.error(err?.message || 'Không thể cập nhật yêu thích.');
        } finally {
            setFavoriteLoading(false);
        }
    };

    const loadReviewPage = useCallback(async (pageNumber, append = false) => {
        const response = await reviewApi.getHotelReviews(id, { page: pageNumber, limit: REVIEW_PAGE_SIZE });
        const payload = response?.data;

        let items = [];
        if (Array.isArray(payload)) {
            items = payload;
        } else if (Array.isArray(payload?.content)) {
            items = payload.content;
        } else if (Array.isArray(payload?.items)) {
            items = payload.items;
        }

        const mapped = items.map(mapReviewItem);

        if (append) {
            setReviews((prev) => [...prev, ...mapped]);
        } else {
            setReviews(mapped);
        }

        setReviewPage(pageNumber);
        setHasMoreReviews(items.length === REVIEW_PAGE_SIZE);
    }, [id]);

    useEffect(() => {
        const fetchInitialReviews = async () => {
            if (!id) return;

            try {
                setReviewLoading(true);
                await loadReviewPage(1, false);
            } catch {
                setReviews([]);
                setHasMoreReviews(false);
            } finally {
                setReviewLoading(false);
            }
        };

        fetchInitialReviews();
    }, [id, loadReviewPage]);

    // Check if user can review this hotel
    useEffect(() => {
        const checkCanReview = async () => {
            if (!isAuthenticated || !hotel?.id) {
                setCanReview(false);
                return;
            }
            try {
                const res = await reviewApi.canUserReview('HOTEL', Number(hotel.id));
                setCanReview(Boolean(res?.data?.data?.canReview));
            } catch {
                setCanReview(false);
            }
        };
        checkCanReview();
    }, [isAuthenticated, hotel?.id]);

    const handleLoadMoreReviews = useCallback(async () => {
        if (!hasMoreReviews || reviewLoadingMore) return;

        try {
            setReviewLoadingMore(true);
            await loadReviewPage(reviewPage + 1, true);
        } finally {
            setReviewLoadingMore(false);
        }
    }, [hasMoreReviews, reviewLoadingMore, loadReviewPage, reviewPage]);

    const handleReviewFilesChange = useCallback((event) => {
        const nextFiles = Array.from(event?.target?.files || []).slice(0, MAX_REVIEW_MEDIA_FILES);
        const tooLarge = nextFiles.find((file) => Number(file?.size || 0) > MAX_REVIEW_MEDIA_FILE_SIZE);

        if (tooLarge) {
            setReviewSubmitState((prev) => ({
                ...prev,
                error: `File ${tooLarge.name} vượt quá giới hạn 25MB.`,
                success: '',
            }));
            return;
        }

        setReviewFiles(nextFiles);
        setReviewSubmitState((prev) => ({ ...prev, error: '' }));
    }, []);

    const handleRemoveReviewFile = useCallback((fileKey) => {
        setReviewFiles((prev) => prev.filter((file, index) => getReviewFileKey(file, index) !== fileKey));
    }, []);

    useEffect(() => {
        const previews = reviewFiles.map((file, index) => ({
            file,
            key: getReviewFileKey(file, index),
            url: URL.createObjectURL(file),
            isVideo: String(file.type || '').startsWith('video/'),
        }));

        setReviewFilePreviews(previews);

        return () => {
            previews.forEach((preview) => {
                URL.revokeObjectURL(preview.url);
            });
        };
    }, [reviewFiles]);

    const handleSubmitReview = useCallback(async () => {
        if (reviewSubmitState.loading) return;

        const normalizedComment = String(reviewDraft.comment || '').trim();
        if (!normalizedComment && reviewFiles.length === 0) {
            setReviewSubmitState({ loading: false, error: 'Bạn cần nhập nội dung hoặc đính kèm media.', success: '' });
            return;
        }

        try {
            setReviewSubmitState({ loading: true, error: '', success: '' });

            await reviewApi.createReviewWithMedia({
                reviewData: {
                    targetType: 'HOTEL',
                    targetId: Number(id),
                    overallRating: Number(reviewDraft.rating || 5),
                    comment: normalizedComment || null,
                },
                files: reviewFiles,
            });

            await loadReviewPage(1, false);
            setReviewDraft({ rating: 5, comment: '' });
            setReviewFiles([]);
            setReviewFileInputKey((prev) => prev + 1);
            setReviewSubmitState({ loading: false, error: '', success: 'Đã gửi đánh giá thành công.' });
        } catch (err) {
            setReviewSubmitState({
                loading: false,
                error: err?.message || 'Không thể gửi đánh giá lúc này.',
                success: '',
            });
        }
    }, [id, loadReviewPage, reviewDraft.comment, reviewDraft.rating, reviewFiles, reviewSubmitState.loading]);

    const handleBookNow = useCallback((overrideRoom = null) => {
        const room = overrideRoom || selectedRoom;
        if (!room) return;
        const params = new URLSearchParams({
            checkIn: checkIn || new Date().toISOString().slice(0, 10),
            checkOut: checkOut || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            adults,
            children,
            rooms,
            roomTypeId: String(room.id),
        });
        router.push(`/hotels/${id}/book?${params.toString()}`);
    }, [id, selectedRoom, checkIn, checkOut, adults, children, rooms, router]);

    if (loading) return <div className={styles.statusBox}>⏳ Đang tải thông tin khách sạn...</div>;
    if (error) return (
        <div className={styles.statusBoxError}>
            <p>{error}</p>
            <button onClick={() => router.back()} className={styles.backBtn}>← Quay lại</button>
        </div>
    );
    if (!hotel) return null;

    const rating = Number(hotel.avgRating || 0);
    const mainImage = hotel.coverImage || GALLERY_FALLBACKS[0];
    const selectedRoomOffers = getRoomOffers(selectedRoom, nights, rooms);
    const nearbyData = getNearbyData(hotel);
    const mapQuery = encodeURIComponent(`${hotel.name}, ${hotel.address}`);
    const reviewScore = Number(hotel.avgRating || 0);
    const reviewBreakdown = [
        { label: 'Vệ sinh', score: Math.max(0, Math.min(10, reviewScore + 0.2)) },
        { label: 'Tiện nghi phòng', score: Math.max(0, Math.min(10, reviewScore + 0.1)) },
        { label: 'Đồ ăn', score: Math.max(0, Math.min(10, reviewScore - 0.3)) },
        { label: 'Vị trí', score: Math.max(0, Math.min(10, reviewScore + 0.4)) },
        { label: 'Dịch vụ', score: Math.max(0, Math.min(10, reviewScore)) },
    ];
    const hotelPartnerId =
        hotel?.partnerId ||
        hotel?.ownerId ||
        hotel?.hostId ||
        hotel?.operatorId ||
        hotel?.owner?.id ||
        hotel?.operator?.id ||
        hotel?.partner?.id ||
        null;
    const roomAlternatives = (hotel.roomTypes || []).filter((room) => room?.id !== selectedRoom?.id);

    const goToHotelDetail = (hotelId) => {
        const params = new URLSearchParams({
            checkIn: checkIn || new Date().toISOString().slice(0, 10),
            checkOut: checkOut || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            adults,
            children,
            rooms,
        });
        router.push(`/hotels/${hotelId}?${params.toString()}`);
    };

    return (
        <div className={styles.page}>
            {/* Back button */}
            <button className={styles.backTopBtn} onClick={() => router.back()}>
                <FaArrowLeft /> Quay lại kết quả
            </button>

            {/* ── Photo Gallery ── */}
            <div className={styles.gallery}>
                <div className={styles.galleryMain}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mainImage} alt={hotel.name} />
                </div>
                <div className={styles.galleryGrid}>
                    {GALLERY_FALLBACKS.map((img, i) => (
                        <div key={i} className={`${styles.galleryThumb} ${i === 3 ? styles.galleryThumbLast : ''}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt={`${hotel.name} ${i + 2}`} />
                            {i === 3 && <div className={styles.seeMore}>📷 Xem thêm ảnh</div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Main Layout: Left + Right ── */}
            <div className={styles.layout}>
                {/* LEFT COLUMN */}
                <div className={styles.leftCol}>
                    {/* Tabs */}
                    <div className={styles.tabs}>
                        {TABS.map((tab, i) => (
                            <button
                                key={tab}
                                className={`${styles.tab} ${activeTab === i ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab(i)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Price Calendar Toggle */}
                    <div className={styles.priceCalendarWrap}>
                        <button
                            className={`${styles.tab} ${showCalendar ? styles.tabActive : ''}`}
                            onClick={() => setShowCalendar((v) => !v)}
                            style={{ marginBottom: 12 }}
                        >
                            <FaRegCalendarAlt style={{ marginRight: 6 }} />
                            Lịch giá
                        </button>
                        {showCalendar && selectedRoom && (
                            <PriceCalendar
                                hotelId={Number(hotel.id)}
                                roomTypeId={selectedRoom.id}
                                basePricePerNight={Number(selectedRoom.basePricePerNight || 1000000)}
                                pricingRules={[]}
                                adults={Number(adults || 2)}
                                selectedCheckIn={calendarCheckIn || null}
                                selectedCheckOut={calendarCheckOut || null}
                                onSelectDates={(ci, co) => {
                                    setCalendarCheckIn(ci || '');
                                    setCalendarCheckOut(co || '');
                                    if (ci && co) {
                                        const params = new URLSearchParams(searchParams.toString());
                                        params.set('checkIn', ci);
                                        params.set('checkOut', co);
                                        router.replace(`/hotels/${id}?${params.toString()}`, { scroll: false });
                                    }
                                }}
                            />
                        )}
                    </div>

                    {/* Tab: Place Details */}
                    {activeTab === 0 && (
                        <div className={styles.tabPanel}>
                            <div className={styles.descGrid}>
                                <p>{hotel.description || 'Khách sạn sang trọng tọa lạc tại vị trí đắc địa, mang đến trải nghiệm lưu trú hoàn hảo với đội ngũ nhân viên tận tâm và cơ sở vật chất hiện đại.'}</p>
                                <p>Tận hưởng không gian nghỉ dưỡng đẳng cấp với đầy đủ tiện nghi từ hồ bơi vô cực, trung tâm thể hình, đến nhà hàng phục vụ ẩm thực đa dạng.</p>
                            </div>
                            <h4 className={styles.sectionTitle}>Tiện nghi</h4>
                            <div className={styles.amenitiesGrid}>
                                {AMENITIES.map((a, i) => (
                                    <div key={i} className={styles.amenityItem}>
                                        <span className={styles.amenityIcon}>{a.icon}</span>
                                        <span>{a.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab: Info & Prices */}
                    {activeTab === 1 && (
                        <div className={styles.tabPanel}>
                            <div className={styles.infoTable}>
                                <div className={styles.infoRow}><span>Check-in</span><strong>{hotel.checkInTime ? String(hotel.checkInTime).slice(0, 5) : '14:00'}</strong></div>
                                <div className={styles.infoRow}><span>Check-out</span><strong>{hotel.checkOutTime ? String(hotel.checkOutTime).slice(0, 5) : '12:00'}</strong></div>
                                <div className={styles.infoRow}><span>Xếp hạng</span><strong>{'⭐'.repeat(hotel.starRating || 3)} ({hotel.starRating} sao)</strong></div>
                                <div className={styles.infoRow}><span>Thành phố</span><strong>{hotel.city}</strong></div>
                                <div className={styles.infoRow}><span>Địa chỉ</span><strong>{hotel.address}</strong></div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Rooms & Beds */}
                    {activeTab === 2 && (
                        <div className={styles.tabPanel}>
                            <p className={styles.roomTabHint}>Chọn loại phòng phù hợp rồi bấm <strong>Đặt ngay</strong></p>
                            {(hotel.roomTypes || []).length === 0
                                ? <p>Hiện không có phòng nào.</p>
                                : (hotel.roomTypes || []).map((rt) => (
                                    <div
                                        key={rt.id}
                                        className={`${styles.roomCard} ${selectedRoom?.id === rt.id ? styles.roomCardSelected : ''}`}
                                        onClick={() => {
                                            setSelectedRoom(rt);
                                            const params = new URLSearchParams(searchParams.toString());
                                            params.set('roomTypeId', String(rt.id));
                                            router.replace(`/hotels/${id}?${params.toString()}`, { scroll: false });
                                        }}
                                    >
                                        <div className={styles.roomCardLeft}>
                                            <div className={styles.roomIconWrap}><FaBed /></div>
                                            <div>
                                                <strong className={styles.roomName}>{rt.name}</strong>
                                                <p className={styles.roomMeta}>Tối đa {rt.capacity} người lớn · {rt.totalRooms} phòng</p>
                                                {rt.description && <p className={styles.roomDesc}>{rt.description}</p>}
                                                <AvailabilityBadge
                                                    hotelId={hotel?.id}
                                                    checkIn={checkIn}
                                                    checkOut={checkOut}
                                                    adults={adults}
                                                    rooms={rooms}
                                                    roomTypeId={rt.id}
                                                    compact
                                                />
                                            </div>
                                        </div>
                                        <div className={styles.roomPriceCol}>
                                            <span className={styles.roomPrice}>{formatVND(rt.basePricePerNight)}</span>
                                            <span className={styles.perNight}>/đêm</span>
                                            <button
                                                className={styles.bookRoomBtn}
                                                onClick={(e) => { e.stopPropagation(); handleBookNow(rt); }}
                                            >
                                                Đặt ngay
                                            </button>
                                        </div>
                                    </div>
                                ))
                            }

                            {selectedRoom && (
                                <section className={styles.offersSection}>
                                    <div className={styles.offersHeaderRow}>
                                        <h4 className={styles.offersTitle}>Ưu đãi cho phòng {selectedRoom.name}</h4>
                                        <span className={styles.offersMeta}>Có {selectedRoomOffers.length} ưu đãi đang áp dụng</span>
                                    </div>

                                    <div className={styles.offerGrid}>
                                        {selectedRoomOffers.map((offer) => (
                                            <article key={offer.code} className={styles.offerCard}>
                                                <span className={styles.offerBadge}>{offer.badge}</span>
                                                <h5 className={styles.offerName}>{offer.title}</h5>
                                                <p className={styles.offerDetail}>{offer.detail}</p>
                                                <span className={styles.offerCode}>Mã ưu đãi: {offer.code}</span>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}

                    {/* Tab: Place Rules */}
                    {activeTab === 3 && (
                        <div className={styles.tabPanel}>
                            {['🚭 Không hút thuốc trong phòng', '🐾 Không mang thú cưng', '🎉 Không tổ chức tiệc / sự kiện', '🔕 Giờ yên tĩnh: 22:00 – 08:00', '🪪 Yêu cầu xuất trình CMND / Hộ chiếu khi nhận phòng'].map((rule, i) => (
                                <p key={i} className={styles.ruleItem}>{rule}</p>
                            ))}
                        </div>
                    )}

                    <section className={styles.roomAlternativesSection}>
                        <div className={styles.roomAlternativesHeader}>
                            <h3 className={styles.roomAlternativesTitle}>Các loại phòng khác trong cùng khách sạn</h3>
                            <p className={styles.roomAlternativesSub}>Nếu phòng hiện tại chưa phù hợp, bạn có thể đổi nhanh sang lựa chọn bên dưới.</p>
                        </div>

                        {roomAlternatives.length === 0 ? (
                            <div className={styles.altStatusBox}>Hiện chưa có thêm loại phòng khác để gợi ý.</div>
                        ) : (
                            <div className={styles.altRoomGrid}>
                                {roomAlternatives.map((room) => (
                                    <article key={room.id} className={styles.altRoomCard}>
                                        <h4 className={styles.altRoomName}>{room.name}</h4>
                                        <p className={styles.altRoomMeta}>Tối đa {room.capacity} người lớn · {room.totalRooms} phòng</p>
                                        {room.description && <p className={styles.altRoomDesc}>{room.description}</p>}

                                        <div className={styles.altRoomBottom}>
                                            <div>
                                                <p className={styles.altRoomPrice}>{formatVND(room.basePricePerNight)}</p>
                                                <p className={styles.altRoomUnit}>/đêm</p>
                                            </div>
                                            <button
                                                className={styles.altRoomBtn}
                                                onClick={() => {
                                                    setSelectedRoom(room);
                                                    setActiveTab(2);
                                                    const params = new URLSearchParams(searchParams.toString());
                                                    params.set('roomTypeId', String(room.id));
                                                    router.replace(`/hotels/${id}?${params.toString()}`, { scroll: false });
                                                }}
                                            >
                                                Chon phong nay
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className={styles.hotelsRecommendSection}>
                        <div className={styles.hotelsRecommendHeader}>
                            <h3 className={styles.hotelsRecommendTitle}>Khách sạn khác cùng khu vực</h3>
                            <p className={styles.hotelsRecommendSub}>Chỉ hiển thị khách sạn trong cùng khu vực {hotel.city}, sắp xếp theo đánh giá cao.</p>
                        </div>

                        {recommendedHotelsLoading && <div className={styles.altStatusBox}>Đang tải gợi ý khách sạn...</div>}

                        {!recommendedHotelsLoading && recommendedHotels.length === 0 && (
                            <div className={styles.altStatusBox}>Hiện chưa có khách sạn gợi ý phù hợp.</div>
                        )}

                        {!recommendedHotelsLoading && recommendedHotels.length > 0 && (
                            <div className={styles.recommendedHotelsGrid}>
                                {recommendedHotels.map((item) => (
                                    <article key={item.id} className={styles.recommendedHotelCard}>
                                        <div className={styles.recommendedHotelImageWrap}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={item.coverImage || GALLERY_FALLBACKS[0]}
                                                alt={item.name}
                                                className={styles.recommendedHotelImage}
                                            />
                                        </div>

                                        <div className={styles.recommendedHotelBody}>
                                            <h4 className={styles.recommendedHotelName}>{item.name}</h4>
                                            <p className={styles.recommendedHotelMeta}>{item.city} · ★ {Number(item.avgRating || 0).toFixed(1)} · {(item.reviewCount || 0).toLocaleString('vi-VN')} đánh giá</p>
                                            <p className={styles.recommendedHotelPrice}>Từ {formatVND(item.minPricePerNight)} /đêm</p>

                                            <button
                                                className={styles.recommendedHotelBtn}
                                                onClick={() => goToHotelDetail(item.id)}
                                            >
                                                Xem khách sạn
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className={styles.nearbySection}>
                        <h3 className={styles.nearbyTitle}>Có gì nổi bật quanh {hotel.name}?</h3>

                        <div className={styles.highlightChips}>
                            {nearbyData.highlightTags.map((tag) => (
                                <span key={tag} className={styles.highlightChip}>{tag}</span>
                            ))}
                        </div>

                        <div className={styles.nearbyMapCard}>
                            <p className={styles.mapAddressLine}>
                                <FaMapMarkerAlt className={styles.mapAddressIcon} />
                                {hotel.address}
                            </p>

                            <div className={styles.mapFrameWrap}>
                                <HotelMap hotel={hotel} className={styles.mapFrame} />
                            </div>

                            <div className={styles.poiList}>
                                {nearbyData.pois.map((poi) => (
                                    <article key={poi.name} className={styles.poiItem}>
                                        <div className={styles.poiHead}>
                                            <h4 className={styles.poiName}>{poi.name}</h4>
                                            <span className={styles.poiType}>{poi.type}</span>
                                        </div>
                                        <div className={styles.poiMetaRow}>
                                            <span>{poi.distanceKm.toFixed(1)} km</span>
                                            <span><FaWalking /> {poi.walkMin} phút đi bộ</span>
                                            <span><FaBus /> {poi.driveMin} phút đi xe</span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className={styles.nearbyToursSection}>
                        <div className={styles.nearbyToursHeader}>
                            <h3 className={styles.nearbyToursTitle}>Tour bắt đầu từ khu vực này</h3>
                            <p className={styles.nearbyToursSub}>Gợi ý tour du lịch gần {hotel.city}, ưu tiên lịch khởi hành sớm và còn chỗ.</p>
                        </div>

                        {tourLoading && <div className={styles.tourStatusBox}>Đang tải gợi ý tour...</div>}

                        {!tourLoading && nearbyTours.length === 0 && (
                            <div className={styles.tourStatusBox}>Chưa có tour phù hợp khu vực này. Bạn thử đổi điểm đến khác nhé.</div>
                        )}

                        {!tourLoading && nearbyTours.length > 0 && (
                            <div className={styles.nearbyToursGrid}>
                                {nearbyTours.map((tour) => (
                                    <article key={tour.id} className={styles.tourCard}>
                                        <div className={styles.tourImageWrap}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={tour.coverImage || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80'}
                                                alt={tour.title}
                                                className={styles.tourImage}
                                            />
                                        </div>

                                        <div className={styles.tourBody}>
                                            <p className={styles.tourCity}>{tour.city}</p>
                                            <h4 className={styles.tourTitle}>{tour.title}</h4>

                                            <div className={styles.tourMeta}>
                                                <span>{tour.durationDays || 1}N{tour.durationNights || 0}D</span>
                                                <span>★ {Number(tour.avgRating || 0).toFixed(1)}</span>
                                                <span>{Number(tour.reviewCount || 0).toLocaleString('vi-VN')} đánh giá</span>
                                            </div>

                                            <p className={styles.tourDeparture}><FaRegCalendarAlt /> Khởi hành gần nhất: {formatDateVi(tour.nearestDepartureDate)}</p>

                                            <div className={styles.tourBottom}>
                                                <div>
                                                    <p className={styles.tourPrice}>{formatVND(tour.pricePerAdult)}</p>
                                                    <p className={styles.tourSeats}>Còn {Math.max(0, Number(tour.availableSlots || 0))} chỗ</p>
                                                </div>

                                                <button
                                                    className={styles.tourCta}
                                                    onClick={() => router.push(`/tours/${tour.id}`)}
                                                >
                                                    Xem tour
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className={styles.reviewsSection}>
                        <h3 className={styles.reviewsTitle}>Đánh giá từ khách đã lưu trú tại {hotel.name}</h3>

                        <div className={styles.reviewsOverview}>
                            <div className={styles.reviewScoreBox}>
                                <p className={styles.reviewScoreValue}>{reviewScore.toFixed(1)}</p>
                                <p className={styles.reviewScoreLabel}>{getRatingLabel(reviewScore)}</p>
                                <p className={styles.reviewScoreCount}>Từ {(hotel.reviewCount || 0).toLocaleString('vi-VN')} đánh giá</p>
                            </div>

                            <div className={styles.reviewBreakdown}>
                                {reviewBreakdown.map((metric) => (
                                    <div key={metric.label} className={styles.reviewMetricRow}>
                                        <span className={styles.reviewMetricLabel}>{metric.label}</span>
                                        <div className={styles.reviewMetricBarTrack}>
                                            <div className={styles.reviewMetricBarFill} style={{ width: `${(metric.score / 10) * 100}%` }} />
                                        </div>
                                        <span className={styles.reviewMetricScore}>{metric.score.toFixed(1)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.reviewComposeCard}>
                            <p className={styles.reviewComposeTitle}>Chia sẻ trải nghiệm lưu trú của bạn</p>
                            {!isAuthenticated ? (
                                <div className={styles.reviewAuthPrompt}>
                                    <p>Vui lòng <a href="/login" className={styles.reviewAuthLink}>đăng nhập</a> để gửi đánh giá.</p>
                                </div>
                            ) : !canReview ? (
                                <div className={styles.reviewAuthPrompt}>
                                    <p>Chỉ khách đã từng lưu trú tại khách sạn này mới có thể gửi đánh giá.</p>
                                </div>
                            ) : (
                                <>
                            <div className={styles.reviewComposeRow}>
                                <label className={styles.reviewComposeLabel} htmlFor="hotel-review-rating">Điểm đánh giá</label>
                                <select
                                    id="hotel-review-rating"
                                    className={styles.reviewComposeSelect}
                                    value={reviewDraft.rating}
                                    onChange={(event) => setReviewDraft((prev) => ({ ...prev, rating: Number(event.target.value || 5) }))}
                                >
                                    {[5, 4, 3, 2, 1].map((value) => (
                                        <option key={value} value={value}>{value} sao</option>
                                    ))}
                                </select>
                            </div>
                            <textarea
                                className={styles.reviewComposeTextarea}
                                placeholder="Viết đánh giá về phòng, vị trí, dịch vụ..."
                                value={reviewDraft.comment}
                                onChange={(event) => setReviewDraft((prev) => ({ ...prev, comment: event.target.value }))}
                            />
                            <div className={styles.reviewComposeRow}>
                                <label className={styles.reviewComposeLabel} htmlFor="hotel-review-media">Ảnh/Video đính kèm</label>
                                <input
                                    key={reviewFileInputKey}
                                    id="hotel-review-media"
                                    type="file"
                                    accept={REVIEW_MEDIA_ACCEPT}
                                    multiple
                                    className={styles.reviewComposeFileInput}
                                    onChange={handleReviewFilesChange}
                                />
                            </div>

                            {reviewFilePreviews.length > 0 && (
                                <div className={styles.reviewComposeFiles}>
                                    {reviewFilePreviews.map((preview) => (
                                        <article key={preview.key} className={styles.reviewComposePreviewCard}>
                                            <div className={styles.reviewComposePreviewMedia}>
                                                {preview.isVideo ? (
                                                    <video src={preview.url} controls preload="metadata" className={styles.reviewComposePreviewVideo} />
                                                ) : (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={preview.url} alt={preview.file.name} className={styles.reviewComposePreviewImage} />
                                                )}
                                            </div>
                                            <div className={styles.reviewComposePreviewMeta}>
                                                <p className={styles.reviewComposeFileItem}>{preview.file.name}</p>
                                                <p className={styles.reviewComposeFileSize}>{formatFileSize(preview.file.size)}</p>
                                                <button
                                                    type="button"
                                                    className={styles.reviewComposeRemoveBtn}
                                                    onClick={() => handleRemoveReviewFile(preview.key)}
                                                >
                                                    Xóa file
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}

                            {reviewSubmitState.error && <p className={styles.reviewComposeError}>{reviewSubmitState.error}</p>}
                            {reviewSubmitState.success && <p className={styles.reviewComposeSuccess}>{reviewSubmitState.success}</p>}

                            <button
                                className={styles.reviewComposeBtn}
                                onClick={handleSubmitReview}
                                disabled={reviewSubmitState.loading}
                            >
                                {reviewSubmitState.loading ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                                </>
                            )}
                        </div>

                        {reviewLoading && <div className={styles.reviewStatusBox}>Đang tải đánh giá...</div>}

                        {!reviewLoading && reviews.length === 0 && (
                            <div className={styles.reviewStatusBox}>Chưa có đánh giá chi tiết cho khách sạn này.</div>
                        )}

                        {!reviewLoading && reviews.length > 0 && (
                            <div className={styles.reviewList}>
                                {reviews.map((review) => (
                                    <article key={review.id} className={styles.reviewCard}>
                                        <div className={styles.reviewUserCol}>
                                            <div className={styles.reviewAvatar}>{review.initials}</div>
                                            <p className={styles.reviewUserName}>{review.userName}</p>
                                        </div>

                                        <div className={styles.reviewContentCol}>
                                            <div className={styles.reviewTopMeta}>
                                                <span className={styles.reviewRatingBadge}>{review.rating.toFixed(1)} / 10</span>
                                                <span className={styles.reviewDate}>{formatRelativeWeeks(review.createdAt)}</span>
                                                {review.verified && (
                                                    <span className={styles.reviewVerifiedBadge}>
                                                        <FaCheckCircle size={12} /> Đã xác thực đã đi
                                                    </span>
                                                )}
                                            </div>
                                            <p className={styles.reviewComment}>{review.comment}</p>
                                            {(review.imageUrls.length > 0 || review.videoUrls.length > 0) && (
                                                <div className={styles.reviewMediaWrap}>
                                                    {review.imageUrls.length > 0 && (
                                                        <div className={styles.reviewMediaGrid}>
                                                            {review.imageUrls.map((url, idx) => (
                                                                <a
                                                                    key={`${review.id}-image-${idx}`}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className={styles.reviewMediaItem}
                                                                >
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img
                                                                        src={url}
                                                                        alt={`Review media ${idx + 1}`}
                                                                        className={styles.reviewMediaImage}
                                                                    />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {review.videoUrls.length > 0 && (
                                                        <div className={styles.reviewVideoList}>
                                                            {review.videoUrls.map((url, idx) => (
                                                                isDirectVideoUrl(url) ? (
                                                                    <video
                                                                        key={`${review.id}-video-${idx}`}
                                                                        controls
                                                                        preload="metadata"
                                                                        className={styles.reviewVideoPlayer}
                                                                    >
                                                                        <source src={url} />
                                                                        Trình duyệt không hỗ trợ video.
                                                                    </video>
                                                                ) : (
                                                                    <a
                                                                        key={`${review.id}-video-link-${idx}`}
                                                                        href={url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className={styles.reviewVideoLink}
                                                                    >
                                                                        Xem video đính kèm
                                                                    </a>
                                                                )
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <button
                                                className={`${styles.helpfulBtn} ${helpfulMap[review.id] ? styles.helpfulBtnActive : ''}`}
                                                onClick={async () => {
                                                    if (!isAuthenticated) {
                                                        toast.info('Vui lòng đăng nhập để đánh dấu hữu ích.');
                                                        const redirect = typeof window !== 'undefined'
                                                            ? `?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}` : '';
                                                        router.push(`/login${redirect}`);
                                                        return;
                                                    }
                                                    const wasVoted = helpfulMap[review.id];
                                                    setHelpfulMap((m) => ({ ...m, [review.id]: !wasVoted }));
                                                    try {
                                                        const res = await reviewApi.toggleHelpful(review.id);
                                                        const newCount = res?.data?.helpfulCount ?? (wasVoted ? Math.max(0, (review.helpfulCount || 0) - 1) : (review.helpfulCount || 0) + 1);
                                                        setHelpfulMap((m) => ({ ...m, [review.id]: !wasVoted }));
                                                        setReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, helpfulCount: newCount } : r));
                                                    } catch {
                                                        setHelpfulMap((m) => ({ ...m, [review.id]: wasVoted }));
                                                        toast.error('Không thể cập nhật. Vui lòng thử lại.');
                                                    }
                                                }}
                                            >
                                                <FaThumbsUp size={11} />
                                                Hữu ích {helpfulMap[review.id] ? (review.helpfulCount || 0) + 1 : review.helpfulCount || 0}
                                            </button>
                                        </div>

                                        {review.partnerReply && (
                                            <div className={styles.partnerReplyBox}>
                                                <div className={styles.partnerReplyHeader}>
                                                    <span className={styles.partnerReplyLabel}>Phản hồi từ đối tác</span>
                                                    {review.partnerRepliedAt && (
                                                        <span className={styles.partnerReplyDate}>
                                                            {new Date(review.partnerRepliedAt).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={styles.partnerReplyText}>{review.partnerReply}</p>
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}

                        {!reviewLoading && hasMoreReviews && (
                            <button
                                className={styles.loadMoreReviewsBtn}
                                onClick={handleLoadMoreReviews}
                                disabled={reviewLoadingMore}
                            >
                                {reviewLoadingMore ? 'Đang tải...' : 'Xem thêm đánh giá'}
                            </button>
                        )}
                    </section>

                    {/* FAQ + AI Chat */}
                    <div className={styles.faqSection}>
                        <h3 className={styles.faqTitle}>Câu hỏi thường gặp trước khi đặt phòng</h3>
                        <InlineFaqChat
                            context="HOTEL"
                            ownerId={hotelPartnerId}
                            ownerName={hotel?.ownerName || hotel?.partnerName || hotel?.name}
                            onChatWithOwner={(seed) => {
                                setChatSeed({
                                    type: 'P2P_HOTEL',
                                    partnerId: hotelPartnerId,
                                    referenceId: hotel?.id,
                                    title: hotel?.ownerName || hotel?.partnerName || hotel?.name,
                                });
                                setChatModalOpen(true);
                            }}
                        />
                    </div>
                </div>

                {/* RIGHT COLUMN — Booking Widget */}
                <div className={styles.rightCol}>
                    <div className={styles.bookingCard}>
                        <h2 className={styles.hotelName}>{hotel.name}</h2>
                        <p className={styles.hotelAddr}>
                            <FaMapMarkerAlt className={styles.addrIcon} /> {hotel.address}
                        </p>

                        <div className={styles.ratingRow}>
                            <span className={styles.ratingScore}><FaStar /> {rating.toFixed(1)}</span>
                            <span className={styles.ratingLabel}>{getRatingLabel(rating)}</span>
                            <span className={styles.reviewCount}>({(hotel.reviewCount || 0).toLocaleString('vi-VN')} đánh giá)</span>
                        </div>

                        <AvailabilityBadge
                            hotelId={hotel?.id}
                            checkIn={checkIn}
                            checkOut={checkOut}
                            adults={adults}
                            rooms={rooms}
                            compact
                        />

                        <hr className={styles.divider} />

                        {/* Stay info */}
                        <p className={styles.stayInfo}>
                            {adults} Người lớn{Number(children) > 0 ? `, ${children} Trẻ em` : ''} · {nights} đêm · {rooms} phòng
                        </p>
                        {checkIn && checkOut && (
                            <div className={styles.datesRow}>
                                <div className={styles.dateBox}><span>Check-in</span><strong>{checkIn}</strong></div>
                                <span className={styles.dateArrow}>→</span>
                                <div className={styles.dateBox}><span>Check-out</span><strong>{checkOut}</strong></div>
                            </div>
                        )}

                        <hr className={styles.divider} />

                        {/* Selected room + price */}
                        {selectedRoom ? (
                            <>
                                <p className={styles.selectedLabel}>
                                    Loại phòng đã chọn: <strong>{selectedRoom.name}</strong>
                                </p>
                                <div className={styles.priceBlock}>
                                    {priceLoading ? (
                                        <div className={styles.totalPrice}>Đang tính giá...</div>
                                    ) : dynamicPrice ? (
                                        <>
                                            <div className={styles.totalPrice}>{formatVND(dynamicPrice)}</div>
                                            <div className={styles.priceNote}>
                                                {formatVND(selectedRoom.basePricePerNight)} × {nights} đêm × {rooms} phòng
                                                {(dynamicPrice !== Number(selectedRoom.basePricePerNight) * nights * Number(rooms)) && (
                                                    <span style={{ color: '#e74c3c', marginLeft: 6 }}>(đã áp dụng giá động)</span>
                                                )}
                                            </div>
                                            <div className={styles.taxNote}>Đã bao gồm thuế và phí</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className={styles.totalPrice}>{formatVND(Number(selectedRoom.basePricePerNight) * nights * Number(rooms))}</div>
                                            <div className={styles.priceNote}>{formatVND(selectedRoom.basePricePerNight)} × {nights} đêm × {rooms} phòng</div>
                                            <div className={styles.taxNote}>Đã bao gồm thuế và phí</div>
                                        </>
                                    )}
                                </div>
                                <button className={styles.bookNowBtn} onClick={() => handleBookNow()}>
                                    Đặt phòng ngay
                                </button>
                                <button
                                    className={`${styles.tab} ${styles.switchRoomBtn}`}
                                    onClick={() => setActiveTab(2)}
                                >
                                    Đổi loại phòng khác
                                </button>
                            </>
                        ) : (
                            <p className={styles.noRoom}>
                                Vui lòng qua tab <strong>Phòng & Giường</strong> để chọn phòng
                            </p>
                        )}

                        {/* Chat với Chủ — luôn hiển thị khi có owner */}
                        {hotelPartnerId && (
                            <button
                                className={styles.chatOwnerBtn}
                                onClick={() => {
                                    setChatSeed({
                                        type: 'P2P_HOTEL',
                                        partnerId: hotelPartnerId,
                                        referenceId: hotel?.id,
                                        title: hotel?.ownerName || hotel?.partnerName || hotel?.name,
                                    });
                                    setChatModalOpen(true);
                                }}
                            >
                                Chat với Chủ
                            </button>
                        )}

                        <button
                            className={`${styles.wishlistBtn} ${isFavorite ? styles.wishlistBtnActive : ''}`}
                            onClick={handleToggleFavorite}
                            disabled={favoriteLoading}
                        >
                            <FaHeart />
                            {isFavorite ? 'Đã lưu yêu thích' : 'Lưu vào danh sách yêu thích'}
                        </button>

                        <ShareButtons
                            url={`${typeof window !== 'undefined' ? window.location.origin : ''}/hotels/${hotel?.id}`}
                            title={`${hotel?.name} — Đặt phòng trên Tourista Studio`}
                            description={`${hotel?.name} ${hotel?.address ? 'tại ' + hotel.address : ''}. Giá chỉ từ ${hotel?.minPrice ? formatVND(hotel.minPrice) : 'liên hệ'}.`}
                            image={hotel?.coverImage || hotel?.images?.[0]}
                            size="sm"
                        />
                    </div>
                </div>
            </div>

            <ClientChatModal
                isOpen={chatModalOpen}
                onClose={() => { setChatModalOpen(false); setChatSeed(null); }}
                conversationSeed={chatSeed}
            />
        </div>
    );
}

// ── Default export: bọc Suspense ──
export default function HotelDetailPage() {
    return (
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontSize: 16, color: '#666' }}>⏳ Đang tải...</div>}>
            <HotelDetailInner />
        </Suspense>
    );
}
