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
            return getDefaultSuggestions(limit);
        }

        int perType = Math.max(2, limit / 4);

        List<AutocompleteResponse> results = new ArrayList<>();

        List<Object[]> cityRows = cityRepository.searchCities(q, perType);
        results.addAll(cityRows.stream()
                .map(row -> AutocompleteResponse.builder()
                        .id(toLong(row[0]))
                        .value(toString(row[1]))
                        .type("Diem den")
                        .detail(toString(row[2]))
                        .build())
                .toList());

        List<Object[]> hotelRows = hotelRepository.searchHotelsAutocomplete(q, perType);
        results.addAll(hotelRows.stream()
                .map(row -> AutocompleteResponse.builder()
                        .id(toLong(row[0]))
                        .value(toString(row[1]))
                        .type("Khach san")
                        .detail(toString(row[2]))
                        .build())
                .toList());

        List<Object[]> tourRows = tourRepository.searchToursAutocomplete(q, perType);
        results.addAll(tourRows.stream()
                .map(row -> AutocompleteResponse.builder()
                        .id(toLong(row[0]))
                        .value(toString(row[1]))
                        .type("Tour")
                        .detail(toString(row[2]))
                        .build())
                .toList());

        return deduplicateAndSort(results, q, limit);
    }

    private List<AutocompleteResponse> getDefaultSuggestions(int limit) {
        List<AutocompleteResponse> defaults = new ArrayList<>();
        defaults.add(AutocompleteResponse.builder().value("Đà Nẵng").type("Diem den").detail("Thành phố biển").build());
        defaults.add(AutocompleteResponse.builder().value("Nha Trang").type("Diem den").detail("Bãi biển đẹp").build());
        defaults.add(AutocompleteResponse.builder().value("Phú Quốc").type("Diem den").detail("Đảo ngọc").build());
        defaults.add(AutocompleteResponse.builder().value("Hà Nội").type("Diem den").detail("Thủ đô").build());
        defaults.add(AutocompleteResponse.builder().value("Hồ Chí Minh").type("Diem den").detail("Thành phố Hồ Chí Minh").build());
        return defaults.stream().limit(limit).toList();
    }

    private List<AutocompleteResponse> deduplicateAndSort(
            List<AutocompleteResponse> items, String query, int limit) {

        Map<String, AutocompleteResponse> byValue = items.stream()
                .collect(Collectors.toMap(
                        item -> item.getValue().toLowerCase(),
                        item -> item,
                        (a, b) -> a));

        List<AutocompleteResponse> sorted = new ArrayList<>(byValue.values());

        String lowerQuery = query.toLowerCase();

        sorted.sort((a, b) -> {
            String aVal = a.getValue().toLowerCase();
            String bVal = b.getValue().toLowerCase();

            boolean aStarts = aVal.startsWith(lowerQuery);
            boolean bStarts = bVal.startsWith(lowerQuery);

            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            int typeOrder = typePriority(a.getType()) - typePriority(b.getType());
            if (typeOrder != 0) return typeOrder;

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
