package vn.tourista.dto.response;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompareCategoryResponse {
    private List<CategoryCountResponse> categories;
}
