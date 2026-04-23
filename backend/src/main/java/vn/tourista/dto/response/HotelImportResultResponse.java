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
public class HotelImportResultResponse {

    private int totalProcessed;
    private int successCount;
    private int skippedCount;
    private int errorCount;
    private List<String> errors;
    private List<Long> insertedHotelIds;
    private List<String> skippedReasons;
}
