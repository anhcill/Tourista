package vn.tourista.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.exceptions.CsvValidationException;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.tourista.dto.request.CsvHotelRow;
import vn.tourista.dto.request.HotelImportRequest;
import vn.tourista.dto.response.HotelImportPreviewResponse;
import vn.tourista.dto.response.HotelImportPreviewResponse.PreviewRow;
import vn.tourista.dto.response.HotelImportResultResponse;
import vn.tourista.entity.City;
import vn.tourista.entity.Hotel;
import vn.tourista.entity.HotelImage;
import vn.tourista.entity.RoomType;
import vn.tourista.entity.User;
import vn.tourista.repository.CityRepository;
import vn.tourista.repository.HotelImageRepository;
import vn.tourista.repository.HotelRepository;
import vn.tourista.repository.RoomTypeRepository;
import vn.tourista.repository.UserRepository;
import vn.tourista.service.HotelImportService;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

@Service
@Slf4j
public class HotelImportServiceImpl implements HotelImportService {

    private final HotelRepository hotelRepository;
    private final HotelImageRepository hotelImageRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final CityRepository cityRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    private static final String DEFAULT_OWNER_EMAIL = "ducanhle28072003@gmail.com";

    private static final Pattern NON_PRINTABLE = Pattern.compile("[\\x00-\\x1F\\x7F]");
    private static final Pattern MULTI_SPACE = Pattern.compile("\\s+");
    private static final Pattern VIETNAMESE_DIACRITICS = Pattern.compile(
            "[\\p{InCombiningDiacriticalMarks}]");
    private static final Pattern ESCAPED_BACKSLASH_QUOTE = Pattern.compile("\\\\\"");

    public HotelImportServiceImpl(HotelRepository hotelRepository,
                                   HotelImageRepository hotelImageRepository,
                                   RoomTypeRepository roomTypeRepository,
                                   CityRepository cityRepository,
                                   UserRepository userRepository) {
        this.hotelRepository = hotelRepository;
        this.hotelImageRepository = hotelImageRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.cityRepository = cityRepository;
        this.userRepository = userRepository;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public List<CsvHotelRow> parseCsv(String csvContent) {
        List<CsvHotelRow> rows = new ArrayList<>();
        log.info("parseCsv: content length = {}, null? {}, blank? {}",
                csvContent == null ? "null" : csvContent.length(),
                csvContent == null, csvContent == null ? false : csvContent.isBlank());

        if (csvContent == null || csvContent.isBlank()) {
            log.warn("parseCsv: empty content");
            return rows;
        }

        // Strip UTF-8 BOM if present (common in files saved from Excel, Google Sheets)
        if (csvContent.length() > 0 && csvContent.charAt(0) == '\uFEFF') {
            log.info("parseCsv: removed BOM");
            csvContent = csvContent.substring(1);
        }

        String[] lines = splitCsvContent(csvContent);
        log.info("parseCsv: {} lines after split", lines.length);
        if (lines.length < 2) {
            log.warn("parseCsv: less than 2 lines, returning empty");
            return rows;
        }

        String[] headers = splitCsvLine(lines[0]);
        log.info("parseCsv: headers = {}", Arrays.toString(headers));
        if (headers == null || headers.length == 0) {
            log.warn("parseCsv: no headers found");
            return rows;
        }

        Map<String, Integer> headerMap = new HashMap<>();
        for (int i = 0; i < headers.length; i++) {
            headerMap.put(headers[i].trim().toLowerCase(), i);
        }

        for (int lineIdx = 1; lineIdx < lines.length; lineIdx++) {
            String[] values = splitCsvLine(lines[lineIdx]);
            if (values.length == 1 && values[0].trim().isEmpty()) continue;

            CsvHotelRow row = CsvHotelRow.builder()
                    .title(getValueSafe(values, headerMap, "title"))
                    .category(getValueSafe(values, headerMap, "category"))
                    .address(getValueSafe(values, headerMap, "address"))
                    .openHours(getValueSafe(values, headerMap, "open_hours"))
                    .website(getValueSafe(values, headerMap, "website"))
                    .phone(getValueSafe(values, headerMap, "phone"))
                    .plusCode(getValueSafe(values, headerMap, "plus_code"))
                    .reviewCount(parseIntSafe(getValueSafe(values, headerMap, "review_count")))
                    .reviewRating(parseDecimalSafe(getValueSafe(values, headerMap, "review_rating")))
                    .latitude(parseDecimalSafe(getValueSafe(values, headerMap, "latitude")))
                    .longitude(parseDecimalSafe(getValueSafe(values, headerMap, "longitude")))
                    .placeId(getValueSafe(values, headerMap, "place_id"))
                    .descriptions(getValueSafe(values, headerMap, "descriptions"))
                    .thumbnail(getValueSafe(values, headerMap, "thumbnail"))
                    .priceRange(getValueSafe(values, headerMap, "price_range"))
                    .completeAddress(getValueSafe(values, headerMap, "complete_address"))
                    .about(getValueSafe(values, headerMap, "about"))
                    .images(getValueSafe(values, headerMap, "images"))
                    .build();

            rows.add(row);
        }

        return rows;
    }

    @Override
    public HotelImportPreviewResponse previewImport(HotelImportRequest request) {
        List<CsvHotelRow> rows = request.getRows();
        List<PreviewRow> previewRows = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        for (int i = 0; i < rows.size() && i < 20; i++) {
            CsvHotelRow row = rows.get(i);
            String validationResult = validateRow(row);
            String name = cleanString(row.getTitle());
            if (name.isEmpty()) name = "(Không tên)";

            BigDecimal fakePrice = null;
            if (request.isGenerateFakePrices() && validationResult == null) {
                fakePrice = generateRandomPrice(row.getReviewRating());
            }

            String status;
            String message = null;
            if (validationResult == null) {
                status = "OK";
            } else if (validationResult.startsWith("WARN:")) {
                status = "WARNING";
                message = validationResult.substring(5);
                warnings.add("Row " + (i + 2) + ": " + message);
            } else {
                status = "SKIP";
                message = validationResult;
            }

            previewRows.add(PreviewRow.builder()
                    .rowNumber(i + 2)
                    .name(name.length() > 60 ? name.substring(0, 60) + "..." : name)
                    .address(truncate(row.getAddress(), 80))
                    .latitude(row.getLatitude())
                    .longitude(row.getLongitude())
                    .reviewCount(row.getReviewCount())
                    .rating(row.getReviewRating())
                    .status(status)
                    .message(message)
                    .fakePrice(fakePrice)
                    .build());
        }

        long validCount = rows.stream().filter(r -> validateRow(r) == null).count();
        long skipCount = rows.size() - validCount;
        if (rows.size() > 20) {
            warnings.add("Hiển thị 20/ " + rows.size() + " dòng. " + validCount + " hợp lệ, " + skipCount + " bị bỏ qua.");
        }

        return HotelImportPreviewResponse.builder()
                .totalRows(rows.size())
                .validRows((int) validCount)
                .skippedRows((int) skipCount)
                .previewRows(previewRows)
                .errors(errors)
                .warnings(warnings)
                .build();
    }

    @Override
    @Transactional
    public HotelImportResultResponse executeImport(HotelImportRequest request) {
        List<CsvHotelRow> rows = request.getRows();
        List<String> errors = new ArrayList<>();
        List<Long> insertedHotelIds = new ArrayList<>();
        List<String> skippedReasons = new ArrayList<>();
        int successCount = 0;
        int skippedCount = 0;
        int errorCount = 0;

        Map<String, City> cityCache = buildCityCache();

        int defaultCityIdRaw = request.getDefaultCityId() != null ? request.getDefaultCityId() : 1;
        City defaultCity = cityCache.values().stream()
                .filter(c -> c.getId() == defaultCityIdRaw).findFirst().orElse(null);
        if (defaultCity == null) {
            defaultCity = cityCache.values().stream().findFirst().orElse(null);
        }
        final int defaultCityId = defaultCity != null ? defaultCity.getId() : 1;
        final City finalDefaultCity = defaultCity;

        int batchCounter = 0;
        for (int idx = 0; idx < rows.size(); idx++) {
            CsvHotelRow row = rows.get(idx);
            int rowNum = idx + 2;
            String validation = validateRow(row);

            if (validation != null && !validation.startsWith("WARN:")) {
                skippedCount++;
                skippedReasons.add("Row " + rowNum + ": " + validation);
                continue;
            }

            try {
                String cleanName = cleanString(row.getTitle());
                if (cleanName.isEmpty()) {
                    skippedCount++;
                    skippedReasons.add("Row " + rowNum + ": Tên khách sạn trống");
                    continue;
                }

                String baseSlug = generateSlug(cleanName);
                String slug = baseSlug;
                int suffix = 0;
                while (hotelRepository.existsBySlug(slug)) {
                    slug = baseSlug + "-" + (++suffix);
                    if (suffix > 100) {
                        slug = baseSlug + "-" + System.currentTimeMillis();
                        break;
                    }
                }

                int cityId = resolveCityId(row.getAddress(), defaultCityId, cityCache);
                City city = cityCache.values().stream()
                        .filter(c -> c.getId() == cityId).findFirst().orElse(finalDefaultCity);
                if (city == null) {
                    skippedCount++;
                    skippedReasons.add("Row " + rowNum + ": Không tìm được thành phố phù hợp");
                    continue;
                }

                String cleanAddress = cleanString(row.getAddress());
                String cleanDescription = cleanString(row.getDescriptions());
                if (cleanDescription != null && cleanDescription.length() > 2000) {
                    cleanDescription = cleanDescription.substring(0, 2000);
                }

                int starRating = estimateStarRating(row.getReviewRating(), cleanDescription);

                // Load default owner so customers can chat with the partner
                User owner = userRepository.findByEmail(DEFAULT_OWNER_EMAIL).orElse(null);
                if (owner == null) {
                    log.warn("Default owner email '{}' not found in DB — hotel {} will have no owner",
                            DEFAULT_OWNER_EMAIL, cleanName);
                }

                Hotel hotel = Hotel.builder()
                        .city(city)
                        .owner(owner)
                        .name(cleanName)
                        .slug(slug)
                        .description(cleanDescription)
                        .address(cleanAddress)
                        .latitude(row.getLatitude())
                        .longitude(row.getLongitude())
                        .starRating(starRating)
                        .avgRating(row.getReviewRating() != null
                                ? row.getReviewRating().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                        .reviewCount(row.getReviewCount() != null ? row.getReviewCount() : 0)
                        .checkInTime(java.time.LocalTime.of(14, 0, 0))
                        .checkOutTime(java.time.LocalTime.of(12, 0, 0))
                        .phone(cleanString(row.getPhone()))
                        .website(cleanString(row.getWebsite()))
                        .isFeatured(false)
                        .isTrending(false)
                        .adminStatus(request.isAutoApprove()
                                ? Hotel.AdminStatus.APPROVED : Hotel.AdminStatus.PENDING)
                        .isActive(true)
                        .build();

                Hotel savedHotel = hotelRepository.save(hotel);
                insertedHotelIds.add(savedHotel.getId());
                successCount++;

                List<String> imageUrls = parseImages(row.getImages(), row.getThumbnail());
                int sortOrder = 0;
                for (String url : imageUrls) {
                    String cleanUrl = cleanString(url);
                    if (isValidImageUrl(cleanUrl)) {
                        HotelImage img = HotelImage.builder()
                                .hotel(savedHotel)
                                .url(cleanUrl)
                                .altText(cleanName)
                                .isCover(sortOrder == 0)
                                .sortOrder(sortOrder)
                                .build();
                        hotelImageRepository.save(img);
                        sortOrder++;
                    }
                }

                if (request.isGenerateFakePrices()) {
                    createFakeRoomTypes(savedHotel, row.getReviewRating());
                }

                batchCounter++;
                if (batchCounter % 50 == 0) {
                    log.info("Imported {} hotels so far...", batchCounter);
                }

            } catch (Exception e) {
                errorCount++;
                String errMsg = "Row " + rowNum + " (" + row.getTitle() + "): " + e.getMessage();
                log.error("Error importing hotel row {}: {}", rowNum, e.getMessage(), e);
                if (errors.size() < 100) {
                    errors.add(errMsg);
                }
            }
        }

        List<String> limitedSkipped = skippedReasons.size() > 50
                ? skippedReasons.subList(0, 50) : skippedReasons;

        return HotelImportResultResponse.builder()
                .totalProcessed(rows.size())
                .successCount(successCount)
                .skippedCount(skippedCount)
                .errorCount(errorCount)
                .errors(errors)
                .insertedHotelIds(insertedHotelIds)
                .skippedReasons(limitedSkipped)
                .build();
    }

    private String validateRow(CsvHotelRow row) {
        if (row.getTitle() == null || row.getTitle().trim().isEmpty()) {
            return "Tên khách sạn trống";
        }

        String category = row.getCategory();
        if (category != null) {
            String catLower = category.toLowerCase();
            if (!catLower.contains("hotel") && !catLower.contains("hostel")
                    && !catLower.contains("resort") && !catLower.contains("motel")
                    && !catLower.contains("guest") && !catLower.contains("homestay")
                    && !catLower.contains("inn") && !catLower.contains("lodge")) {
                return "WARN: Category '" + category + "' không phải loại lưu trú";
            }
        }

        if (row.getLatitude() == null || row.getLongitude() == null) {
            return "WARN: Không có tọa độ (sẽ import nhưng không hiển thị trên bản đồ)";
        }

        return null;
    }

    private Map<String, City> buildCityCache() {
        Map<String, City> cache = new HashMap<>();
        List<City> allCities = cityRepository.findAll();

        // Build name->City mapping preferring first occurrence
        for (City city : allCities) {
            String vi = city.getNameVi() != null ? city.getNameVi().toLowerCase() : "";
            String en = city.getNameEn() != null ? city.getNameEn().toLowerCase() : "";
            String slug = city.getSlug() != null ? city.getSlug().toLowerCase() : "";

            // Only add if not already present (prefer first/original city)
            if (!cache.containsKey(vi) && !vi.isEmpty()) cache.put(vi, city);
            if (!cache.containsKey(en) && !en.isEmpty()) cache.put(en, city);
            if (!cache.containsKey(slug) && !slug.isEmpty()) cache.put(slug, city);

            // Aliases for Vietnamese city names
            if (vi.contains("hà nội") || vi.contains("hanoi")) { if (!cache.containsKey("hanoi")) cache.put("hanoi", city); }
            if (vi.contains("hồ chí minh") || en.contains("ho chi minh")) { if (!cache.containsKey("ho chi minh")) cache.put("ho chi minh", city); }
            if (vi.contains("đà nẵng") || en.contains("da nang")) { if (!cache.containsKey("da nang")) cache.put("da nang", city); }
            if (vi.contains("nha trang")) { if (!cache.containsKey("nha trang")) cache.put("nha trang", city); }
            if (vi.contains("phú quốc") || en.contains("phu quoc")) { if (!cache.containsKey("phu quoc")) cache.put("phu quoc", city); }
            if (vi.contains("hội an") || en.contains("hoi an")) { if (!cache.containsKey("hoi an")) cache.put("hoi an", city); }
            if (vi.contains("hạ long") || en.contains("ha long")) { if (!cache.containsKey("ha long")) cache.put("ha long", city); }
            if (vi.contains("đà lạt") || en.contains("da lat")) { if (!cache.containsKey("da lat")) cache.put("da lat", city); }
            if (vi.contains("vũng tàu") || en.contains("vung tau")) { if (!cache.containsKey("vung tau")) cache.put("vung tau", city); }
            if (vi.contains("huế") || en.contains("hue")) { if (!cache.containsKey("hue")) cache.put("hue", city); }
            if (vi.contains("sa pa") || slug.contains("sa-pa")) { if (!cache.containsKey("sa pa")) cache.put("sa pa", city); }
            if (vi.contains("cần thơ") || en.contains("can tho")) { if (!cache.containsKey("can tho")) cache.put("can tho", city); }
        }
        return cache;
    }

    private int resolveCityId(String address, int defaultCityId, Map<String, City> cityCache) {
        if (address == null || address.isEmpty()) {
            return defaultCityId;
        }

        String addrLower = address.toLowerCase();

        String[] keywords = {
                "hà nội", "hanoi", "hoàn kiếm", "hoan kiem",
                "hồ chí minh", "ho chi minh", "tp hcm",
                "đà nẵng", "da nang",
                "nha trang", "khánh hòa",
                "phú quốc", "phu quoc",
                "hội an", "hoi an",
                "hạ long", "ha long",
                "cần thơ", "can tho",
                "sa pa", "sapa",
                "đà lạt", "da lat", "dalat",
                "vũng tàu", "vung tau",
                "huế", "hue"
        };

        for (String keyword : keywords) {
            if (addrLower.contains(keyword)) {
                String cacheKey = keyword.contains("hà nội") ? "hanoi"
                        : keyword.contains("hồ chí minh") ? "ho chi minh"
                        : keyword.contains("đà nẵng") ? "da nang"
                        : keyword.contains("nha trang") ? "nha trang"
                        : keyword.contains("phú quốc") ? "phu quoc"
                        : keyword.contains("hội an") ? "hoi an"
                        : keyword.contains("hạ long") ? "ha long"
                        : keyword.contains("đà lạt") ? "da lat"
                        : keyword.contains("vũng tàu") ? "vung tau"
                        : keyword.contains("huế") ? "hue"
                        : keyword.contains("sa pa") ? "sa pa"
                        : keyword;

                City found = cityCache.get(cacheKey);
                if (found != null) {
                    return found.getId();
                }
            }
        }

        return defaultCityId;
    }

    private int estimateStarRating(BigDecimal rating, String description) {
        if (rating != null) {
            if (rating.compareTo(new BigDecimal("4.6")) >= 0) return 5;
            if (rating.compareTo(new BigDecimal("4.1")) >= 0) return 4;
            if (rating.compareTo(new BigDecimal("3.6")) >= 0) return 3;
            if (rating.compareTo(new BigDecimal("3.0")) >= 0) return 2;
        }
        if (description != null) {
            String desc = description.toLowerCase();
            if (desc.contains("luxury") || desc.contains("boutique")) return 5;
            if (desc.contains("premium") || desc.contains("superior")) return 4;
        }
        return 3;
    }

    private List<String> parseImages(String imagesJson, String thumbnail) {
        List<String> urls = new ArrayList<>();

        if (thumbnail != null && !thumbnail.isEmpty() && isValidImageUrl(thumbnail)) {
            urls.add(thumbnail);
        }

        if (imagesJson == null || imagesJson.isBlank()) {
            return urls;
        }

        try {
            String cleaned = imagesJson.trim();

            // Replace \" escaped quotes with actual quotes so JSON parser can read them
            cleaned = ESCAPED_BACKSLASH_QUOTE.matcher(cleaned).replaceAll("\"");

            if (cleaned.startsWith("[")) {
                List<ImageItem> items = objectMapper.readValue(cleaned,
                        new TypeReference<List<ImageItem>>() {});
                for (ImageItem item : items) {
                    if (item.image != null && isValidImageUrl(item.image)
                            && !item.image.contains("streetviewpixels")) {
                        urls.add(item.image);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse images JSON: {}", e.getMessage());
        }

        return urls.stream().distinct().limit(10).toList();
    }

    /**
     * Validates image URLs.
     * - Must start with http:// or https://
     * - Must not be a Street View thumbnail
     * - Google Photos URLs may contain \" inside quoted CSV fields — cleaned before this check
     */
    private boolean isValidImageUrl(String url) {
        if (url == null || url.isEmpty()) return false;
        String trimmed = url.trim();
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return false;
        // Block Street View pixel thumbnails
        if (trimmed.contains("streetviewpixels")) return false;
        // Block empty or placeholder URLs
        if (trimmed.equals("null") || trimmed.equals("undefined")) return false;
        // Reject URLs that still contain backslash artifacts (unclosed JSON strings)
        if (trimmed.contains("\\")) return false;
        return true;
    }

    private void createFakeRoomTypes(Hotel hotel, BigDecimal rating) {
        int stars = estimateStarRating(rating, null);

        String[][] roomConfigs;
        double minPrice, maxPrice;

        if (stars >= 5) {
            roomConfigs = new String[][]{
                    {"Standard Room", "Phòng tiêu chuẩn sang trọng với tầm nhìn thành phố.", "2", "Queen", "25"},
                    {"Superior Room", "Phòng Superior rộng rãi với tiện nghi cao cấp.", "2", "King", "30"},
                    {"Deluxe Room", "Phòng Deluxe với ban công và tầm nhìn đẹp.", "2", "King", "38"},
                    {"Junior Suite", "Suite nhỏ cao cấp với phòng khách riêng.", "3", "King", "55"},
                    {"Executive Suite", "Suite Executive với không gian rộng và tiện nghi VIP.", "3", "King", "80"}
            };
            minPrice = 1500000;
            maxPrice = 8500000;
        } else if (stars >= 4) {
            roomConfigs = new String[][]{
                    {"Standard Room", "Phòng tiêu chuẩn sạch sẽ, thoải mái.", "2", "Double", "22"},
                    {"Superior Room", "Phòng Superior với tiện nghi đầy đủ.", "2", "Queen", "28"},
                    {"Deluxe Room", "Phòng Deluxe rộng rãi và sang trọng.", "2", "King", "35"},
                    {"Junior Suite", "Suite cao cấp với không gian riêng tư.", "3", "King", "50"}
            };
            minPrice = 700000;
            maxPrice = 3000000;
        } else {
            roomConfigs = new String[][]{
                    {"Standard Room", "Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản.", "2", "Double", "18"},
                    {"Superior Room", "Phòng Superior thoải mái với WiFi miễn phí.", "2", "Queen", "24"},
                    {"Deluxe Room", "Phòng Deluxe rộng rãi và tiện nghi.", "2", "King", "30"}
            };
            minPrice = 280000;
            maxPrice = 900000;
        }

        for (int i = 0; i < roomConfigs.length; i++) {
            String[] cfg = roomConfigs[i];
            double basePrice = minPrice + (maxPrice - minPrice) * (i + 1) / cfg.length;
            double variance = (Math.random() - 0.5) * 0.15 * basePrice;
            double finalPrice = Math.round((basePrice + variance) / 5000) * 5000;

            RoomType rt = RoomType.builder()
                    .hotel(hotel)
                    .name(cfg[0])
                    .description(cfg[1])
                    .maxAdults(Integer.parseInt(cfg[2]))
                    .maxChildren(1)
                    .bedType(cfg[3])
                    .areaSqm(new BigDecimal(cfg[4]))
                    .basePricePerNight(BigDecimal.valueOf(finalPrice))
                    .totalRooms(5 + (int)(Math.random() * 15))
                    .isActive(true)
                    .build();
            roomTypeRepository.save(rt);
        }
    }

    @Override
    public String cleanString(String input) {
        if (input == null) return null;
        String result = input.trim();
        result = NON_PRINTABLE.matcher(result).replaceAll("");
        result = result.replaceAll("[\\x{200B}-\\x{200F}\\x{FEFF}]", "");
        // Remove backslash-escaped quotes (\") left over from CSV-escaped JSON
        result = ESCAPED_BACKSLASH_QUOTE.matcher(result).replaceAll("\"");
        // Remove any remaining stray backslashes (not valid in text)
        result = result.replace("\\", "");
        result = MULTI_SPACE.matcher(result).replaceAll(" ");
        return result;
    }

    @Override
    public String generateSlug(String name) {
        if (name == null || name.isEmpty()) return "hotel-" + System.currentTimeMillis();

        String slug = name.toLowerCase(Locale.ROOT);
        slug = Normalizer.normalize(slug, Normalizer.Form.NFD);
        slug = VIETNAMESE_DIACRITICS.matcher(slug).replaceAll("");
        slug = slug.replaceAll("[^a-z0-9\\s]", "");
        slug = slug.replaceAll("\\s+", "-");
        slug = slug.replaceAll("^-+|-+$", "");
        slug = slug.length() > 100 ? slug.substring(0, 100) : slug;
        if (slug.isEmpty()) slug = "hotel-" + System.currentTimeMillis();
        return slug;
    }

    private BigDecimal generateRandomPrice(BigDecimal rating) {
        double minP, maxP;
        if (rating != null && rating.compareTo(new BigDecimal("4.6")) >= 0) {
            minP = 1200000;
            maxP = 5000000;
        } else if (rating != null && rating.compareTo(new BigDecimal("4.1")) >= 0) {
            minP = 600000;
            maxP = 2500000;
        } else if (rating != null && rating.compareTo(new BigDecimal("3.6")) >= 0) {
            minP = 350000;
            maxP = 1200000;
        } else {
            minP = 200000;
            maxP = 600000;
        }
        double price = minP + Math.random() * (maxP - minP);
        price = Math.round(price / 5000) * 5000;
        return BigDecimal.valueOf(price);
    }

    private String truncate(String str, int maxLen) {
        if (str == null) return null;
        return str.length() > maxLen ? str.substring(0, maxLen) + "..." : str;
    }

    private String getValueSafe(String[] values, Map<String, Integer> headerMap, String key) {
        Integer idx = headerMap.get(key.toLowerCase());
        if (idx == null || idx >= values.length) return "";
        return values[idx] != null ? values[idx].trim() : "";
    }

    /**
     * Splits a CSV line by comma, respecting RFC 4180 rules:
     * - Quoted fields may contain commas and newlines
     * - Double quotes inside quotes are escaped as ""
     */
    private String[] splitCsvLine(String line) {
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        result.add(current.toString());
        return result.toArray(new String[0]);
    }

    /**
     * Splits full CSV content into individual lines, respecting quoted fields.
     */
    private String[] splitCsvContent(String csvContent) {
        List<String> lines = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder currentLine = new StringBuilder();

        for (int i = 0; i < csvContent.length(); i++) {
            char c = csvContent.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
                currentLine.append(c);
            } else if ((c == '\r' && i + 1 < csvContent.length() && csvContent.charAt(i + 1) == '\n')
                    || (c == '\n' && !(i > 0 && csvContent.charAt(i - 1) == '\r'))) {
                if (!inQuotes) {
                    String line = currentLine.toString();
                    line = line.replaceAll("\\r$", "");
                    lines.add(line);
                    currentLine = new StringBuilder();
                    if (c == '\r') i++;
                    continue;
                } else {
                    currentLine.append(c);
                }
            } else {
                currentLine.append(c);
            }
        }
        String lastLine = currentLine.toString().replaceAll("\\r$", "");
        if (!lastLine.isEmpty()) {
            lines.add(lastLine);
        }

        return lines.toArray(new String[0]);
    }

    private Integer parseIntSafe(String val) {
        if (val == null || val.isEmpty()) return null;
        try {
            String cleaned = val.replaceAll("[^0-9]", "");
            return cleaned.isEmpty() ? null : Integer.parseInt(cleaned);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private BigDecimal parseDecimalSafe(String val) {
        if (val == null || val.isEmpty()) return null;
        try {
            return new BigDecimal(val.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static class ImageItem {
        public String image;
    }
}
