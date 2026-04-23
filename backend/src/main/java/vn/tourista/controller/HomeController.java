package vn.tourista.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.tourista.dto.response.*;
import vn.tourista.repository.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/home")
public class HomeController {

    @Autowired
    private ReviewRepository reviewRepository;
    @Autowired
    private HotelRepository hotelRepository;
    @Autowired
    private TourRepository tourRepository;
    @Autowired
    private PromotionRepository promotionRepository;
    @Autowired
    private CityRepository cityRepository;

    @GetMapping("/testimonials")
    public ResponseEntity<ApiResponse<List<HomeTestimonialResponse>>> getHomeTestimonials(
            @RequestParam(defaultValue = "6") Integer limit) {

        int safeLimit = (limit == null || limit < 1) ? 6 : Math.min(limit, 12);

        List<HomeTestimonialResponse> data = reviewRepository.findPublicTestimonials(safeLimit)
                .stream()
                .map(item -> HomeTestimonialResponse.builder()
                        .id(item.getId())
                        .content(item.getContent())
                        .rating(safeRating(item.getRating()))
                        .authorName(item.getAuthorName())
                        .authorAvatar(item.getAuthorAvatar())
                        .country(item.getCountry())
                        .verified(Boolean.TRUE.equals(item.getVerified()))
                        .targetName(item.getTargetName())
                        .targetType(item.getTargetType())
                        .build())
                .toList();

        return ResponseEntity.ok(ApiResponse.ok("Lay testimonials trang chu thanh cong", data));
    }

    private Double safeRating(Double rating) {
        if (rating == null || rating <= 0) {
            return 4.5;
        }
        return Math.min(5.0, Math.max(1.0, rating));
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats(
            @RequestParam(defaultValue = "8") Integer limit) {

        int safeLimit = (limit == null || limit < 1) ? 8 : Math.min(limit, 16);

        // Trending cities with hotel+tour counts
        List<Object[]> cityRows = cityRepository.findTrendingCities(safeLimit);
        List<TrendingCityResponse> trendingCities = cityRows.stream()
                .map(row -> {
                    Double topHotelRating = toDouble(row[8]);
                    return TrendingCityResponse.builder()
                            .id(toLong(row[0]))
                            .nameVi(toString(row[1]))
                            .nameEn(toString(row[2]))
                            .countryFlag("🇻🇳")
                            .countryName("Việt Nam")
                            .hotelCount(toInt(row[3]))
                            .tourCount(toInt(row[4]))
                            .avgHotelPrice(toDouble(row[5]))
                            .avgRating(topHotelRating)
                            .topHotelName(toString(row[7]))
                            .topHotelRating(topHotelRating)
                            .coverImage(toString(row[9]))
                            .build();
                })
                .toList();

        // Category types - 8 diverse categories
        long hotelCount = hotelRepository.countActiveHotels();
        long tourCount = tourRepository.countActiveTours();
        long hotelPromoCount = promotionRepository.countActiveByAppliesTo("HOTEL");
        long tourPromoCount = promotionRepository.countActiveByAppliesTo("TOUR");
        long allPromoCount = promotionRepository.countActiveByAppliesTo("ALL");
        long villaCount = Math.max(1, hotelCount / 10);
        long resortCount = Math.max(1, hotelCount / 8);
        long homestayCount = Math.max(1, hotelCount / 5);
        long adventureCount = Math.max(1, tourCount / 3);
        long cruiseCount = Math.max(1, tourCount / 5);
        long foodTourCount = Math.max(1, tourCount / 6);

        List<CategoryTypeResponse> categories = List.of(
                CategoryTypeResponse.builder()
                        .type("HOTEL")
                        .label("Khách sạn")
                        .labelEn("Hotels")
                        .icon("FaHotel")
                        .avgRating(4.7)
                        .itemCount((int) hotelCount)
                        .discount("40%")
                        .tag("Yêu thích nhất")
                        .gradient("linear-gradient(135deg, #4facfe, #00f2fe)")
                        .coverImage("https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80")
                        .description("Hơn " + hotelCount + " khách sạn từ bình dân đến sang trọng")
                        .build(),
                CategoryTypeResponse.builder()
                        .type("TOUR")
                        .label("Tour du lịch")
                        .labelEn("Tours")
                        .icon("FaPlane")
                        .avgRating(4.5)
                        .itemCount((int) tourCount)
                        .discount("35%")
                        .tag("Khám phá ngay")
                        .gradient("linear-gradient(135deg, #43e97b, #38f9d7)")
                        .coverImage("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80")
                        .description("Tour trong nước & quốc tế chất lượng cao")
                        .build(),
                CategoryTypeResponse.builder()
                        .type("VILLA")
                        .label("Biệt thự")
                        .labelEn("Villas")
                        .icon("FaBuilding")
                        .avgRating(4.8)
                        .itemCount((int) villaCount)
                        .discount("30%")
                        .tag("Sang trọng")
                        .gradient("linear-gradient(135deg, #667eea, #764ba2)")
                        .coverImage("https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80")
                        .description("Biệt thự riêng tư, view đẹp, tiện nghi cao cấp")
                        .build(),
                CategoryTypeResponse.builder()
                        .type("RESORT")
                        .label("Resort")
                        .labelEn("Resorts")
                        .icon("FaUmbrellaBeach")
                        .avgRating(4.9)
                        .itemCount((int) resortCount)
                        .discount("45%")
                        .tag("Nghỉ dưỡng")
                        .gradient("linear-gradient(135deg, #f093fb, #f5576c)")
                        .coverImage("https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80")
                        .description("Khu nghỉ dưỡng 5 sao, bãi biển riêng")
                        .build(),
                CategoryTypeResponse.builder()
                        .type("HOMESTAY")
                        .label("Homestay")
                        .labelEn("Homestays")
                        .icon("FaHome")
                        .avgRating(4.6)
                        .itemCount((int) homestayCount)
                        .discount("25%")
                        .tag("Ấm cúng")
                        .gradient("linear-gradient(135deg, #ffecd2, #fcb69f)")
                        .coverImage("https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80")
                        .description("Trải nghiệm như người địa phương")
                        .build(),
                CategoryTypeResponse.builder()
                        .type("ADVENTURE")
                        .label("Mạo hiểm")
                        .labelEn("Adventure")
                        .icon("FaMountain")
                        .avgRating(4.4)
                        .itemCount((int) adventureCount)
                        .discount("20%")
                        .tag("Phiêu lưu")
                        .gradient("linear-gradient(135deg, #11998e, #38ef7d)")
                        .coverImage("https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80")
                        .description("Leo núi, trekking, khám phá thiên nhiên")
                        .build(),
                CategoryTypeResponse.builder()
                        .type("CRUISE")
                        .label("Du thuyền")
                        .labelEn("Cruises")
                        .icon("FaShip")
                        .avgRating(4.8)
                        .itemCount((int) cruiseCount)
                        .discount("50%")
                        .tag("Đẳng cấp")
                        .gradient("linear-gradient(135deg, #2193b0, #6dd5ed)")
                        .coverImage("https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&q=80")
                        .description("Du thuyền cao cấp, view biển tuyệt đẹp")
                        .build(),
                CategoryTypeResponse.builder()
                        .type("FOOD_TOUR")
                        .label("Tour ẩm thực")
                        .labelEn("Food Tours")
                        .icon("FaUtensils")
                        .avgRating(4.5)
                        .itemCount((int) foodTourCount)
                        .discount("15%")
                        .tag("Ẩm thực")
                        .gradient("linear-gradient(135deg, #ee9ca7, #ffdde1)")
                        .coverImage("https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80")
                        .description("Khám phá ẩm thực địa phương đặc sắc")
                        .build()
        );

        DashboardStatsResponse stats = DashboardStatsResponse.builder()
                .trendingCities(trendingCities)
                .categories(categories)
                .totalCities(trendingCities.size())
                .totalCategories(categories.size())
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Dashboard stats loaded", stats));
    }

    @GetMapping("/compare-categories")
    public ResponseEntity<ApiResponse<List<CategoryCountResponse>>> getCompareCategories() {
        long hotelCount = hotelRepository.countActiveHotels();
        long tourCount = tourRepository.countActiveTours();
        long hotelPromoCount = promotionRepository.countActiveByAppliesTo("HOTEL");
        long tourPromoCount = promotionRepository.countActiveByAppliesTo("TOUR");
        long allPromoCount = promotionRepository.countActiveByAppliesTo("ALL");

        List<CategoryCountResponse> categories = List.of(
            CategoryCountResponse.builder()
                .type("HOTEL")
                .label("Khách sạn")
                .icon("FaHotel")
                .avgRating(4.7)
                .offerCount((int) Math.min(hotelCount + allPromoCount, 9999))
                .discount(hotelPromoCount + allPromoCount > 0 ? "40%" : "25%")
                .tag("Yêu thích nhất")
                .gradient("linear-gradient(135deg, #4facfe, #00f2fe)")
                .build(),
            CategoryCountResponse.builder()
                .type("TOUR")
                .label("Tour du lịch")
                .icon("FaPlane")
                .avgRating(4.5)
                .offerCount((int) Math.min(tourCount + allPromoCount, 9999))
                .discount(tourPromoCount + allPromoCount > 0 ? "35%" : "20%")
                .tag("Khám phá ngay")
                .gradient("linear-gradient(135deg, #43e97b, #38f9d7)")
                .build()
        );

        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).longValue();
        try { return Long.parseLong(String.valueOf(value)); } catch (Exception e) { return null; }
    }

    private Integer toInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number) return ((Number) value).intValue();
        try { return Integer.parseInt(String.valueOf(value)); } catch (Exception e) { return 0; }
    }

    private Double toDouble(Object value) {
        if (value == null) return 0.0;
        if (value instanceof Number) return ((Number) value).doubleValue();
        try { return Double.parseDouble(String.valueOf(value)); } catch (Exception e) { return 0.0; }
    }

    private String toString(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }
}
