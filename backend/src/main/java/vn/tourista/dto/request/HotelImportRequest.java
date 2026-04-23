package vn.tourista.dto.request;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HotelImportRequest {

    private List<CsvHotelRow> rows;
    private boolean autoApprove;
    private boolean generateFakePrices;
    private Integer defaultCityId;
}
