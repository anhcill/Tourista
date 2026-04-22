package vn.tourista.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.tourista.dto.response.AutocompleteResponse;
import vn.tourista.repository.CityRepository;
import vn.tourista.repository.HotelRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.service.AutocompleteService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AutocompleteServiceImpl implements AutocompleteService {

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private CityRepository cityRepository;

    @Override
    public List<AutocompleteResponse> search(String query, int limit) {
        String q = (query == null) ? "" : query.trim();

        if (q.isEmpty()) {
            return getPopularDestinations(limit);
        }

        String normalizedQuery = removeDiacritics(q.toLowerCase());

        int perType = Math.max(2, limit / 4);

        List<AutocompleteResponse> results = new ArrayList<>();

        List<Object[]> cityRows = cityRepository.searchCities(q, perType);
        results.addAll(cityRows.stream()
                .map(row -> AutocompleteResponse.builder()
                        .id(toLong(row[0]))
                        .value(toString(row[1]))
                        .type("Diem den")
                        .detail(toString(row[2]))
                        .score(calculateCityScore(normalizedQuery, toString(row[1]), toString(row[2])))
                        .build())
                .toList());

        List<Object[]> hotelRows = hotelRepository.searchHotelsAutocomplete(q, perType);
        results.addAll(hotelRows.stream()
                .map(row -> AutocompleteResponse.builder()
                        .id(toLong(row[0]))
                        .value(toString(row[1]))
                        .type("Khach san")
                        .detail(toString(row[2]))
                        .score(calculateHotelScore(normalizedQuery, toString(row[1]), toString(row[3])))
                        .build())
                .toList());

        List<Object[]> tourRows = tourRepository.searchToursAutocomplete(q, perType);
        results.addAll(tourRows.stream()
                .map(row -> AutocompleteResponse.builder()
                        .id(toLong(row[0]))
                        .value(toString(row[1]))
                        .type("Tour")
                        .detail(toString(row[2]))
                        .score(calculateTourScore(normalizedQuery, toString(row[1]), toString(row[2])))
                        .build())
                .toList());

        return deduplicateAndSort(results, q, limit);
    }

    private List<AutocompleteResponse> getPopularDestinations(int limit) {
        List<AutocompleteResponse> popular = new ArrayList<>();
        popular.add(AutocompleteResponse.builder().value("Đà Nẵng").type("Diem den").detail("Thành phố biển nổi tiếng").build());
        popular.add(AutocompleteResponse.builder().value("Nha Trang").type("Diem den").detail("Bãi biển đẹp, resort sang trọng").build());
        popular.add(AutocompleteResponse.builder().value("Phú Quốc").type("Diem den").detail("Đảo ngọc thiên đường du lịch").build());
        popular.add(AutocompleteResponse.builder().value("Hà Nội").type("Diem den").detail("Thủ đô ngàn năm văn hiến").build());
        popular.add(AutocompleteResponse.builder().value("Hồ Chí Minh").type("Diem den").detail("Thành phố năng động nhất nước").build());
        popular.add(AutocompleteResponse.builder().value("Hội An").type("Diem den").detail("Phố cổ UNESCO lung linh").build());
        popular.add(AutocompleteResponse.builder().value("Sapa").type("Diem den").detail("Núi non hùng vĩ, ruộng bậc thang").build());
        popular.add(AutocompleteResponse.builder().value("Cần Thơ").type("Diem den").detail("Miệt vườn sông nước miền Tây").build());
        return popular.stream().limit(limit).toList();
    }

    private int calculateCityScore(String query, String nameVi, String nameEn) {
        int score = 100;
        String normVi = removeDiacritics(nameVi.toLowerCase());
        String normEn = nameEn.toLowerCase();

        if (normVi.equals(query) || normEn.equals(query)) {
            score += 50;
        }
        if (normVi.startsWith(query)) {
            score += 30;
        } else if (normVi.contains(query)) {
            score += 10;
        }
        if (normVi.endsWith(query)) {
            score += 5;
        }
        return score;
    }

    private int calculateHotelScore(String query, String name, String address) {
        int score = 80;
        String normName = removeDiacritics(name.toLowerCase());
        String normAddr = removeDiacritics((address == null ? "" : address).toLowerCase());

        if (normName.equals(query)) {
            score += 40;
        }
        if (normName.startsWith(query)) {
            score += 25;
        } else if (normName.contains(query)) {
            score += 10;
        }
        if (normAddr.contains(query)) {
            score += 5;
        }
        return score;
    }

    private int calculateTourScore(String query, String title, String city) {
        int score = 60;
        String normTitle = removeDiacritics(title.toLowerCase());
        String normCity = removeDiacritics((city == null ? "" : city).toLowerCase());

        if (normTitle.equals(query)) {
            score += 35;
        }
        if (normTitle.startsWith(query)) {
            score += 20;
        } else if (normTitle.contains(query)) {
            score += 8;
        }
        if (normCity.contains(query)) {
            score += 5;
        }
        return score;
    }

    private String removeDiacritics(String text) {
        if (text == null) return "";
        return text
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("đ", "d")
                .replaceAll("[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]", "A")
                .replaceAll("[ÈÉẸẺẼÊỀẾỆỂỄ]", "E")
                .replaceAll("[ÌÍỊỈĨ]", "I")
                .replaceAll("[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]", "O")
                .replaceAll("[ÙÚỤỦŨƯỪỨỰỬỮ]", "U")
                .replaceAll("[ỲÝỴỶỸ]", "Y")
                .replaceAll("Đ", "D");
    }

    private List<AutocompleteResponse> deduplicateAndSort(
            List<AutocompleteResponse> items, String query, int limit) {

        Map<String, AutocompleteResponse> byValue = items.stream()
                .collect(Collectors.toMap(
                        item -> removeDiacritics(item.getValue()).toLowerCase(),
                        item -> item,
                        (a, b) -> a.getScore() >= b.getScore() ? a : b));

        List<AutocompleteResponse> sorted = new ArrayList<>(byValue.values());

        String lowerQuery = query.toLowerCase();

        sorted.sort((a, b) -> {
            String aVal = removeDiacritics(a.getValue()).toLowerCase();
            String bVal = removeDiacritics(b.getValue()).toLowerCase();

            boolean aStarts = aVal.startsWith(lowerQuery);
            boolean bStarts = bVal.startsWith(lowerQuery);

            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            int typeOrder = typePriority(a.getType()) - typePriority(b.getType());
            if (typeOrder != 0) return typeOrder;

            int scoreDiff = b.getScore() - a.getScore();
            if (scoreDiff != 0) return scoreDiff;

            return aVal.compareTo(bVal);
        });

        return sorted.stream().limit(limit).toList();
    }

    private int typePriority(String type) {
        if (type == null) return 99;
        return switch (type) {
            case "Diem den" -> 1;
            case "Tour" -> 2;
            case "Khach san" -> 3;
            default -> 99;
        };
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).longValue();
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String toString(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }
}
