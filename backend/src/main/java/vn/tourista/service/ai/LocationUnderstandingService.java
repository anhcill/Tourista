package vn.tourista.service.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import vn.tourista.entity.City;
import vn.tourista.repository.CityRepository;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Location Understanding Service - giúp AI hiểu location từ user input
 * 
 * Cung cấp:
 * 1. Danh sách tất cả cities trong DB
 * 2. Mapping landmarks/aliases → city codes
 * 3. Reverse lookup: city code → city name
 * 
 * Cách hoạt động:
 * - AI được cung cấp danh sách locations
 * - AI tự nhận diện location từ user input
 * - AI trả về city code (VD: "Ha Noi", "Da Nang")
 * - Backend query DB với city code đó
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LocationUnderstandingService {

    private final CityRepository cityRepository;

    // City code → City info
    private volatile Map<String, CityInfo> cityCodeMap = new ConcurrentHashMap<>();
    
    // All known location aliases (lowercase) → city code
    private volatile Map<String, String> locationAliases = new ConcurrentHashMap<>();
    
    // City code → List of common aliases
    private volatile Map<String, List<String>> cityAliases = new ConcurrentHashMap<>();

    // ============================================================
    // DATA STRUCTURES
    // ============================================================

    public record CityInfo(
            String code,
            String nameVi,
            String nameEn,
            List<String> landmarks,
            List<String> aliases
    ) {}

    // ============================================================
    // INITIALIZATION
    // ============================================================

    @PostConstruct
    public void init() {
        loadCitiesAndLandmarks();
    }

    @Scheduled(fixedRate = 3600000) // Refresh every hour
    public void refreshCache() {
        loadCitiesAndLandmarks();
    }

    private void loadCitiesAndLandmarks() {
        try {
            List<City> cities = cityRepository.findAll();
            
            Map<String, CityInfo> newCityCodeMap = new ConcurrentHashMap<>();
            Map<String, String> newLocationAliases = new ConcurrentHashMap<>();
            Map<String, List<String>> newCityAliases = new ConcurrentHashMap<>();

            for (City city : cities) {
                String code = city.getSlug().toLowerCase().replace("-", " ");
                // Handle special cases for code format
                code = normalizeCityCode(city.getSlug());

                // Build aliases for this city
                List<String> aliases = new ArrayList<>();
                aliases.add(city.getNameVi().toLowerCase());
                aliases.add(city.getNameEn().toLowerCase());
                aliases.add(city.getSlug().toLowerCase());
                aliases.add(city.getSlug().toLowerCase().replace("-", ""));
                
                // Add variations
                aliases.addAll(generateVariations(city.getNameVi()));
                aliases.addAll(generateVariations(city.getNameEn()));

                // Add common landmarks for each city
                List<String> landmarks = getCommonLandmarks(city.getNameVi());

                CityInfo info = new CityInfo(code, city.getNameVi(), city.getNameEn(), landmarks, aliases);
                newCityCodeMap.put(code, info);

                // Register all aliases
                for (String alias : aliases) {
                    newLocationAliases.put(alias, code);
                }
                
                // Register landmarks as aliases
                for (String landmark : landmarks) {
                    newLocationAliases.put(landmark.toLowerCase(), code);
                    aliases.add(landmark);
                }

                newCityAliases.put(code, aliases);
            }

            this.cityCodeMap = newCityCodeMap;
            this.locationAliases = newLocationAliases;
            this.cityAliases = newCityAliases;

            log.info("LocationUnderstandingService: loaded {} cities with {} total aliases", 
                    cities.size(), locationAliases.size());

        } catch (Exception e) {
            log.error("Failed to load cities and landmarks", e);
        }
    }

    private String normalizeCityCode(String slug) {
        // Convert slug to city code format
        return slug.toLowerCase()
                .replace("-", " ")
                .replace("ho chi minh", "ho chi minh city")
                .replace("ho chi minh city", "ho chi minh");
    }

    private List<String> generateVariations(String name) {
        List<String> variations = new ArrayList<>();
        
        // Remove spaces
        variations.add(name.toLowerCase().replace(" ", ""));
        
        // Add with "thành phố" prefix
        variations.add("thành phố " + name.toLowerCase());
        variations.add("tp " + name.toLowerCase());
        
        // Add with common suffixes
        if (name.toLowerCase().contains("đà nẵng") || name.toLowerCase().contains("da nang")) {
            variations.add("đn");
        }
        
        return variations;
    }

    private List<String> getCommonLandmarks(String cityName) {
        // Comprehensive landmarks for each city
        Map<String, List<String>> landmarksMap = Map.ofEntries(
                Map.entry("Hà Nội", List.of(
                        "hồ hoàn kiếm", "hoàn kiếm", "hoan kiem", "hồ gươm", "phố cổ hà nội", "pho co ha noi",
                        "lăng bác", "văn miếu", "tháp rùa", "hà nội cổ", "hanoi old", "old quarter",
                        "thăng long", "ho chi minh complex", "viet nam museum", "opera house",
                        "trung thực", "tràng tiền", "nghi tàm", "quản trường ba đình", "ba dinh",
                        "west lake", "tây hồ", "hồ tây", "ho guom", "hanoi downtown"
                )),
                Map.entry("Đà Nẵng", List.of(
                        "cầu rồng", "cau rong", "dragon bridge", "bà nà", "bà nà hills", "ba na", "ba na hills",
                        "ngũ hành sơn", "ngu hanh son", "sơn trà", "son tra", "mỹ khê", "my khe", "my khe beach",
                        "non nước", "non nuoc", "đà nẵng beach", "sông hàn", "song han", "asiam park",
                        "bà nà", "cầu tình yêu", "helio", "inson", "vincom"
                )),
                Map.entry("Hội An", List.of(
                        "phố cổ hội an", "pho co hoi an", "ancient town", "old town", "cửa đại", "cua dai",
                        "làng cổ", "japanese bridge", "chùa cầu", "hoian", "hoian ancient",
                        "tra que", "trà quế", "thanh hà", "cơm gà", "cao lầu"
                )),
                Map.entry("Huế", List.of(
                        "kinh thành huế", "đại nội", "chùa thiên mu", "lăng tẩm", "lăng minh mạng",
                        "lăng khải định", "sông hương", "song huong", "perfume river", "thien mu",
                        "royal palace", "imperial city", "dong ba market", "chợ đông ba"
                )),
                Map.entry("Hồ Chí Minh", List.of(
                        "sài gòn", "sai gon", "saigon", "phố đi bộ nguyễn huệ", "bến thành",
                        "địa đạo củ chi", "ủy ban nhân dân", "thủ đức", "vincity",
                        "d1", "district 1", "quan 1", "phú nhuận", "binh thạnh", "thao camien",
                        "notre dame", "nhà thờ đức bà", "saigon post office", "bưu điện",
                        "saigon square", "ben thanh", "cho ben thanh"
                )),
                Map.entry("Sapa", List.of(
                        "fansipan", "phansipang", "ruộng bậc thang", "bản cát cát", "cat cat",
                        "sapa town", "thác bạc", "óc ốc", "ham rong", "sapa lake",
                        "sapa stone church", "sapa market", "sapa church", "muong hoa",
                        "lao chai", "ta van", "giang ta chai"
                )),
                Map.entry("Phú Quốc", List.of(
                        "đảo ngọc", "bãi sao", "bai sao", "hòn thơm", "hon thom", "vinpearl safari",
                        "grand world", "vinpearl land", "bãi trường", "bai truong", "dinh cố",
                        "chợ đêm phú quốc", "phu quoc night market", "phu quoc prison",
                        "ganjin", "tranh in", "sun world"
                )),
                Map.entry("Nha Trang", List.of(
                        "bãi trung tâm", "bãi biển trung tâm", "hòn mun", "hon mun", "vinpearl land",
                        "tháp trầm hương", "tram huong", "chùa long sơn", "buddha", "bai san",
                        "ba mui", "doc let", "đầm hà", "dam tra", "nha trang beach",
                        "nha trang center", "nha trang bay", "sailing club"
                )),
                Map.entry("Đà Lạt", List.of(
                        "hồ xuân hương", "xuân hương", "thung lũng tình yêu", "valley of love",
                        "cầu đất", "cau dat", "đường hồ tuyền lâm", "ho tuyen lam", "chợ đà lạt",
                        "da lat market", "crazy house", "dalat palace", "xuân hương lake",
                        "valley of love", "robin hill", "đồi cù lao", "cau dat dairy farm"
                )),
                Map.entry("Hạ Long", List.of(
                        "vịnh hạ long", "vinh ha long", "bãi tắt", "bãi tắc", "hang sửng sốt",
                        "sung sot", "surprise cave", "tùng lâm", "tuong lam", "ti tốp",
                        "ti top", "perlboud", "du thuyền", "ha long bay", "quảng ninh",
                        "bai chay", "tuan chau"
                )),
                Map.entry("Vũng Tàu", List.of(
                        "bãi sau", "bãi trước", "tượng chúa kitô", "tượng đức chúa trời",
                        "ngọn hải đăng", "vung tau lighthouse", "bé ổ", "holy light house",
                        "back beach", "front beach", "statue of jesus"
                )),
                Map.entry("Cần Thơ", List.of(
                        "chợ nổi cần thơ", "bến ninh kiều", "cầu cần thơ", "nhà cổ bình tấy",
                        "vườn cây ăn trái", "floating market", "can tho bridge",
                        "can tho market", "nam song hậu"
                )),
                Map.entry("Hải Phòng", List.of(
                        "đảo cát bà", "cat ba island", "vịnh lan hạ", "lan ha bay",
                        "trung tâm thành phố", "haiphong downtown", "nhà hát lớn",
                        "cat co beach", "quảng trường nguyễn bỉnh khiêm"
                )),
                Map.entry("Quy Nhơn", List.of(
                        "bãi xếp", "bãi trứng", "eo gió", "cù lao", "trung tâm quy nhơn",
                        "quy nhon beach", "quy nhon downtown", "bai seo", "ky co"
                )),
                Map.entry("Phan Thiết", List.of(
                        "mũi né", "muine", "đồi cát", "bình hưng", "bình thuận",
                        "lâu đài rượu vang", "ta cu", "phan thiet beach", "muine beach",
                        "red sand", "white sand"
                )),
                Map.entry("Cà Mau", List.of(
                        "mũi cà mau", "cape ca mau", "đất mũi", "cà mau extreme",
                        "u Minh hạ", "rừng ngập mặn", "cà mau city"
                )),
                Map.entry("Bình Định", List.of(
                        "quy nhơn", "trung tâm bình định", "cù lao xanh", "eò gió",
                        "bình định beach", "quy nhon"
                ))
        );

        return landmarksMap.getOrDefault(cityName, new ArrayList<>());
    }

    // ============================================================
    // PUBLIC API
    // ============================================================

    /**
     * Parse location từ user input, trả về city code hoặc null
     */
    public String parseLocation(String input) {
        if (input == null || input.isBlank()) {
            return null;
        }

        String lower = input.toLowerCase();
        
        // 1. Try exact match with aliases
        for (Map.Entry<String, String> entry : locationAliases.entrySet()) {
            if (lower.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        // 2. Try fuzzy match
        for (String alias : locationAliases.keySet()) {
            if (lower.contains(alias) || alias.contains(lower)) {
                return locationAliases.get(alias);
            }
        }

        return null;
    }

    /**
     * Get city info by code
     */
    public CityInfo getCityInfo(String cityCode) {
        return cityCodeMap.get(cityCode);
    }

    /**
     * Get all cities
     */
    public List<CityInfo> getAllCities() {
        return new ArrayList<>(cityCodeMap.values());
    }

    /**
     * Build context string for AI prompt
     * Format: "Location: Ha Noi (Hà Nội) - landmarks: Hồ Hoàn Kiếm, Phố Cổ..."
     */
    public String buildLocationContextForPrompt() {
        StringBuilder sb = new StringBuilder();
        sb.append("DANH SÁCH ĐỊA ĐIỂM TRONG HỆ THỐNG:\n");
        sb.append("(Dùng thông tin này để nhận diện địa điểm user đề cập)\n\n");

        for (CityInfo city : cityCodeMap.values()) {
            sb.append("- ").append(city.code()).append(" (").append(city.nameVi()).append(")");
            
            if (!city.landmarks().isEmpty()) {
                sb.append(" | Landmarks: ");
                sb.append(String.join(", ", city.landmarks().stream().limit(8).toList()));
            }
            sb.append("\n");
        }

        return sb.toString();
    }

    /**
     * Get reverse lookup: city name → city code
     */
    public String getCityCodeByName(String cityName) {
        if (cityName == null) return null;
        String lower = cityName.toLowerCase();
        
        for (CityInfo city : cityCodeMap.values()) {
            if (city.nameVi().toLowerCase().equals(lower) ||
                city.nameEn().toLowerCase().equals(lower) ||
                city.code().toLowerCase().equals(lower)) {
                return city.code();
            }
        }
        return null;
    }

    /**
     * Check if input contains any location
     */
    public boolean containsLocation(String input) {
        if (input == null || input.isBlank()) {
            return false;
        }
        String lower = input.toLowerCase();
        return locationAliases.keySet().stream().anyMatch(lower::contains);
    }
}
