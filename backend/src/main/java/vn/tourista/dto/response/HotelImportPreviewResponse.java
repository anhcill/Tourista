package vn.tourista.dto.response;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HotelImportPreviewResponse {

    private int totalRows;
    private int validRows;
    private int skippedRows;
    private List<PreviewRow> previewRows;
    private List<String> errors;
    private List<String> warnings;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PreviewRow {
        private int rowNumber;
        private String name;
        private String address;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private Integer reviewCount;
        private BigDecimal rating;
        private String status;
        private String message;
        private BigDecimal fakePrice;
    }

    public static HotelImportPreviewResponse empty() {
        return HotelImportPreviewResponse.builder()
                .totalRows(0)
                .validRows(0)
                .skippedRows(0)
                .previewRows(List.of())
                .errors(List.of())
                .warnings(List.of())
                .build();
    }
}
