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
import reviewApi from '@/api/reviewApi';
import favoriteApi from '@/api/favoriteApi';
import styles from './page.module.css';

const TABS = ['Place Details', 'Info & Prices', 'Rooms & Beds', 'Place Rules'];
const DEFAULT_TAB_INDEX = 2;
const REVIEW_PAGE_SIZE = 4;

const AMENITIES = [
    { icon: <FaWifi />, label: 'Free Wifi' },
    { icon: <FaParking />, label: 'Parking Available' },
    { icon: <FaUtensils />, label: 'Restaurant' },
    { icon: <FaDumbbell />, label: 'Fitness Center' },
    { icon: <FaBath />, label: 'Bathroom' },
    { icon: <FaConciergeBell />, label: 'Room Service' },
    { icon: <MdOutlinePool />, label: 'Swimming Pool' },
    { icon: <FaCoffee />, label: 'Tea/Coffee Machine' },
];

const FAQS = [
    { q: 'How And When Do I Pay?', a: 'Bạn có thể thanh toán tại khách sạn hoặc qua cổng thanh toán trực tuyến an toàn của chúng tôi khi đặt phòng.' },
    { q: 'Is This Option Is A Non-smoking Property?', a: 'Đây là khu vực cấm hút thuốc 100%. Khu vực hút thuốc ngoài trời được bố trí theo quy định.' },
    { q: 'Is Breakfast Included?', a: 'Bữa sáng được bao gồm cho một số loại phòng. Vui lòng kiểm tra chi tiết phòng trước khi đặt.' },
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
    if (!dateString) return 'Lich khoi hanh cap nhat sau';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Lich khoi hanh cap nhat sau';
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
    if (!dateString) return 'Danh gia gan day';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Danh gia gan day';

    const now = new Date();
    const diffDays = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86400000));
    const weeks = Math.max(1, Math.round(diffDays / 7));
    return `Danh gia cach day ${weeks} tuan`;
};

const mapReviewItem = (item, index) => {
    const userName = item?.userName || item?.authorName || `Du khach ${index + 1}`;
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
        comment: item?.comment || item?.content || 'Khach hang chua de lai noi dung chi tiet cho danh gia nay.',
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
            { name: 'Cau Rong', type: 'Dia diem bieu tuong', distanceKm: 1.6, walkMin: 18, driveMin: 6 },
            { name: 'Bao tang Dieu khac Cham', type: 'Van hoa', distanceKm: 1.2, walkMin: 14, driveMin: 5 },
            { name: 'Cho Han', type: 'Mua sam', distanceKm: 1.9, walkMin: 22, driveMin: 8 },
            { name: 'Cong vien APEC', type: 'Giai tri', distanceKm: 1.7, walkMin: 20, driveMin: 7 },
        ],
        'ha noi': [
            { name: 'Ho Guom', type: 'Tham quan', distanceKm: 2.1, walkMin: 25, driveMin: 10 },
            { name: 'Pho co Ha Noi', type: 'Van hoa', distanceKm: 2.6, walkMin: 31, driveMin: 12 },
            { name: 'Nha hat Lon', type: 'Kien truc', distanceKm: 2.3, walkMin: 27, driveMin: 11 },
            { name: 'Trang Tien Plaza', type: 'Mua sam', distanceKm: 2.4, walkMin: 29, driveMin: 10 },
        ],
        'ho chi minh': [
            { name: 'Cho Ben Thanh', type: 'Mua sam', distanceKm: 1.8, walkMin: 21, driveMin: 8 },
            { name: 'Pho di bo Nguyen Hue', type: 'Giai tri', distanceKm: 2.2, walkMin: 26, driveMin: 10 },
            { name: 'Nha tho Duc Ba', type: 'Kien truc', distanceKm: 2.5, walkMin: 30, driveMin: 11 },
            { name: 'Bao tang My thuat', type: 'Van hoa', distanceKm: 1.9, walkMin: 22, driveMin: 9 },
        ],
    };

    const defaultPois = [
        { name: 'Trung tam thanh pho', type: 'Trung tam giao thong', distanceKm: 2.0, walkMin: 24, driveMin: 9 },
        { name: 'Khu am thuc dia phuong', type: 'An uong', distanceKm: 1.3, walkMin: 15, driveMin: 6 },
        { name: 'Diem check-in noi bat', type: 'Giai tri', distanceKm: 2.7, walkMin: 33, driveMin: 12 },
        { name: 'Khu mua sam', type: 'Mua sam', distanceKm: 2.2, walkMin: 26, driveMin: 10 },
    ];

    const pois = Object.entries(byCity).find(([key]) => city.includes(key))?.[1] || defaultPois;

    const highlightTags = [
        'Gan trung tam giao thong',
        'Thuan tien vui choi giai tri',
        'Nhieu nha hang dac san quanh khu vuc',
        'De dang di chuyen den diem check-in',
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
            title: 'Huy mien phi truoc check-in 48h',
            detail: `Ap dung cho ${room.name}. Hoan tien 100% neu huy dung han.`,
            badge: 'Linh hoat',
        },
        {
            code: `BKFAST-${room.id}`,
            title: `Bao gom bua sang cho toi da ${Math.max(1, Number(room.capacity || 1))} khach`,
            detail: 'Buffet sang tai nha hang khach san tu 06:30 - 10:00.',
            badge: 'An sang',
        },
        {
            code: `SAVE-${room.id}`,
            title: `Tiet kiem ${promoPercent}% khi dat ${Math.max(1, Number(nights || 1))} dem`,
            detail: `Tong uu dai uoc tinh: ${formatVND(promoValue)} (chua tinh khuyen mai ngan hang).`,
            badge: 'Uu dai',
        },
        {
            code: `PAYLATER-${room.id}`,
            title: 'Dat truoc, thanh toan sau tai khach san',
            detail: 'Khong can thanh toan toan bo ngay luc dat, giu cho den gio check-in.',
            badge: 'Thanh toan linh hoat',
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
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [helpfulMap, setHelpfulMap] = useState({});
    const [showCalendar, setShowCalendar] = useState(false);

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

                let list = [];

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
                            : [];
                } catch {
                    const fallbackResponse = await hotelApi.getHotels({ limit: 60 });
                    const payload = fallbackResponse?.data;
                    list = Array.isArray(payload)
                        ? payload
                        : Array.isArray(payload?.content)
                            ? payload.content
                            : [];
                }

                const currentHotelId = Number(hotel.id);
                const currentCityNorm = normalizeText(hotel.city);

                const sorted = list
                    .filter((item) => Number(item?.id || 0) !== currentHotelId)
                    .filter((item) => normalizeText(item?.city).includes(currentCityNorm))
                    .sort((a, b) => {
                        return Number(b?.avgRating || 0) - Number(a?.avgRating || 0);
                    })
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

    // Check if this hotel is favorited by the user
    useEffect(() => {
        if (!hotel?.id || !isAuthenticated) {
            setIsFavorite(false);
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
            router.push('/login');
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
                error: `File ${tooLarge.name} vuot qua gioi han 25MB.`,
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
            setReviewSubmitState({ loading: false, error: 'Ban can nhap noi dung hoac dinh kem media.', success: '' });
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
            setReviewSubmitState({ loading: false, error: '', success: 'Da gui danh gia thanh cong.' });
        } catch (err) {
            setReviewSubmitState({
                loading: false,
                error: err?.message || 'Khong the gui danh gia luc nay.',
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
        { label: 'Ve sinh', score: Math.max(0, Math.min(10, reviewScore + 0.2)) },
        { label: 'Tien nghi phong', score: Math.max(0, Math.min(10, reviewScore + 0.1)) },
        { label: 'Do an', score: Math.max(0, Math.min(10, reviewScore - 0.3)) },
        { label: 'Vi tri', score: Math.max(0, Math.min(10, reviewScore + 0.4)) },
        { label: 'Dich vu', score: Math.max(0, Math.min(10, reviewScore)) },
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
                            {i === 3 && <div className={styles.seeMore}>📷 See More Photos</div>}
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
                                basePricePerNight={Number(selectedRoom.basePricePerNight || 1000000)}
                                pricingRules={[]}
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
                            <h4 className={styles.sectionTitle}>Amenities</h4>
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
                                        <h4 className={styles.offersTitle}>Uu dai cho phong {selectedRoom.name}</h4>
                                        <span className={styles.offersMeta}>Co {selectedRoomOffers.length} uu dai dang ap dung</span>
                                    </div>

                                    <div className={styles.offerGrid}>
                                        {selectedRoomOffers.map((offer) => (
                                            <article key={offer.code} className={styles.offerCard}>
                                                <span className={styles.offerBadge}>{offer.badge}</span>
                                                <h5 className={styles.offerName}>{offer.title}</h5>
                                                <p className={styles.offerDetail}>{offer.detail}</p>
                                                <span className={styles.offerCode}>Ma uu dai: {offer.code}</span>
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
                            <h3 className={styles.roomAlternativesTitle}>Cac loai phong khac trong cung khach san</h3>
                            <p className={styles.roomAlternativesSub}>Neu phong hien tai chua phu hop, ban co the doi nhanh sang lua chon ben duoi.</p>
                        </div>

                        {roomAlternatives.length === 0 ? (
                            <div className={styles.altStatusBox}>Hien chua co them loai phong khac de goi y.</div>
                        ) : (
                            <div className={styles.altRoomGrid}>
                                {roomAlternatives.map((room) => (
                                    <article key={room.id} className={styles.altRoomCard}>
                                        <h4 className={styles.altRoomName}>{room.name}</h4>
                                        <p className={styles.altRoomMeta}>Toi da {room.capacity} nguoi lon · {room.totalRooms} phong</p>
                                        {room.description && <p className={styles.altRoomDesc}>{room.description}</p>}

                                        <div className={styles.altRoomBottom}>
                                            <div>
                                                <p className={styles.altRoomPrice}>{formatVND(room.basePricePerNight)}</p>
                                                <p className={styles.altRoomUnit}>/dem</p>
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
                            <h3 className={styles.hotelsRecommendTitle}>Khach san khac cung khu vuc</h3>
                            <p className={styles.hotelsRecommendSub}>Chi hien thi khach san trong cung khu vuc {hotel.city}, sap xep theo danh gia cao.</p>
                        </div>

                        {recommendedHotelsLoading && <div className={styles.altStatusBox}>Dang tai goi y khach san...</div>}

                        {!recommendedHotelsLoading && recommendedHotels.length === 0 && (
                            <div className={styles.altStatusBox}>Hien chua co khach san goi y phu hop.</div>
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
                                            <p className={styles.recommendedHotelMeta}>{item.city} · ★ {Number(item.avgRating || 0).toFixed(1)} · {(item.reviewCount || 0).toLocaleString('vi-VN')} danh gia</p>
                                            <p className={styles.recommendedHotelPrice}>Tu {formatVND(item.minPricePerNight)} /dem</p>

                                            <button
                                                className={styles.recommendedHotelBtn}
                                                onClick={() => goToHotelDetail(item.id)}
                                            >
                                                Xem khach san
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className={styles.nearbySection}>
                        <h3 className={styles.nearbyTitle}>Co gi noi bat quanh {hotel.name}?</h3>

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
                                            <span><FaWalking /> {poi.walkMin} phut di bo</span>
                                            <span><FaBus /> {poi.driveMin} phut di xe</span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className={styles.nearbyToursSection}>
                        <div className={styles.nearbyToursHeader}>
                            <h3 className={styles.nearbyToursTitle}>Tour bat dau tu khu vuc nay</h3>
                            <p className={styles.nearbyToursSub}>Goi y tour du lich gan {hotel.city}, uu tien lich khoi hanh som va con cho.</p>
                        </div>

                        {tourLoading && <div className={styles.tourStatusBox}>Dang tai goi y tour...</div>}

                        {!tourLoading && nearbyTours.length === 0 && (
                            <div className={styles.tourStatusBox}>Chua co tour phu hop khu vuc nay. Ban thu doi diem den khac nhe.</div>
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
                                                <span>{Number(tour.reviewCount || 0).toLocaleString('vi-VN')} danh gia</span>
                                            </div>

                                            <p className={styles.tourDeparture}><FaRegCalendarAlt /> Khoi hanh gan nhat: {formatDateVi(tour.nearestDepartureDate)}</p>

                                            <div className={styles.tourBottom}>
                                                <div>
                                                    <p className={styles.tourPrice}>{formatVND(tour.pricePerAdult)}</p>
                                                    <p className={styles.tourSeats}>Con {Math.max(0, Number(tour.availableSlots || 0))} cho</p>
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
                        <h3 className={styles.reviewsTitle}>Danh gia tu khach da luu tru tai {hotel.name}</h3>

                        <div className={styles.reviewsOverview}>
                            <div className={styles.reviewScoreBox}>
                                <p className={styles.reviewScoreValue}>{reviewScore.toFixed(1)}</p>
                                <p className={styles.reviewScoreLabel}>{getRatingLabel(reviewScore)}</p>
                                <p className={styles.reviewScoreCount}>Tu {(hotel.reviewCount || 0).toLocaleString('vi-VN')} danh gia</p>
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
                            <p className={styles.reviewComposeTitle}>Chia se trai nghiem luu tru cua ban</p>
                            <div className={styles.reviewComposeRow}>
                                <label className={styles.reviewComposeLabel} htmlFor="hotel-review-rating">Diem danh gia</label>
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
                                placeholder="Viet danh gia ve phong, vi tri, dich vu..."
                                value={reviewDraft.comment}
                                onChange={(event) => setReviewDraft((prev) => ({ ...prev, comment: event.target.value }))}
                            />
                            <div className={styles.reviewComposeRow}>
                                <label className={styles.reviewComposeLabel} htmlFor="hotel-review-media">Anh/Video dinh kem</label>
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
                                                    Xoa file
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
                                {reviewSubmitState.loading ? 'Dang gui...' : 'Gui danh gia'}
                            </button>
                        </div>

                        {reviewLoading && <div className={styles.reviewStatusBox}>Dang tai danh gia...</div>}

                        {!reviewLoading && reviews.length === 0 && (
                            <div className={styles.reviewStatusBox}>Chua co danh gia chi tiet cho khach san nay.</div>
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
                                                        <FaCheckCircle size={12} /> Da xac thuc da di
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
                                                                        Trinh duyet khong ho tro video.
                                                                    </video>
                                                                ) : (
                                                                    <a
                                                                        key={`${review.id}-video-link-${idx}`}
                                                                        href={url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className={styles.reviewVideoLink}
                                                                    >
                                                                        Xem video dinh kem
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
                                                        router.push('/login');
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
                                {reviewLoadingMore ? 'Dang tai...' : 'Xem them danh gia'}
                            </button>
                        )}
                    </section>

                    {/* FAQ + AI Chat */}
                    <div className={styles.faqSection}>
                        <h3 className={styles.faqTitle}>Cau hoi thuong gap truoc khi dat phong</h3>
                        <InlineFaqChat context="HOTEL" />
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
                                    <div className={styles.totalPrice}>{formatVND(Number(selectedRoom.basePricePerNight) * nights * Number(rooms))}</div>
                                    <div className={styles.priceNote}>{formatVND(selectedRoom.basePricePerNight)} × {nights} đêm × {rooms} phòng</div>
                                    <div className={styles.taxNote}>Đã bao gồm thuế và phí</div>
                                </div>
                                <button className={styles.bookNowBtn} onClick={() => handleBookNow()}>
                                    Đặt phòng ngay
                                </button>
                                <button
                                    className={styles.chatOwnerBtn}
                                    onClick={() => setChatModalOpen(true)}
                                >
                                    Chat với Chủ
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
                                Vui lòng qua tab <strong>Rooms & Beds</strong> để chọn phòng
                            </p>
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
                onClose={() => setChatModalOpen(false)}
                conversationSeed={{
                    type: 'P2P_HOTEL',
                    partnerId: hotelPartnerId,
                    referenceId: hotel?.id,
                    title: hotel?.name,
                }}
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
