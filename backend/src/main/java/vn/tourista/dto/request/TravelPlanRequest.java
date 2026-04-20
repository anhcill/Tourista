package vn.tourista.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TravelPlanRequest {

    @NotBlank(message = "Điểm đến không được để trống")
    private String destination;

    private String checkIn;
    private String checkOut;

    @Min(value = 1, message = "Ít nhất 1 người")
    private Integer adults;

    private Integer children;

    @Builder.Default
    private String budget = "TRUNG_BINH"; // THAP, TRUNG_BINH, CAO

    private String interests; // comma-separated: beach,culture,food,adventure,nature

    private String tripType; // RELAX, ADVENTURE, FAMILY, ROMANTIC, BUSINESS
}
