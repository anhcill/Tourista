package vn.tourista.dto.response;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private List<TrendingCityResponse> trendingCities;
    private List<CategoryTypeResponse> categories;
    private int totalCities;
    private int totalCategories;
}
