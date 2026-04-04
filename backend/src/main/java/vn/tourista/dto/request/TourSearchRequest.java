package vn.tourista.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TourSearchRequest {

    @NotBlank(message = "City la bat buoc")
    private String city;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate departureDate;

    @Min(value = 1, message = "So nguoi lon phai lon hon hoac bang 1")
    @Builder.Default
    private Integer adults = 1;

    @Min(value = 0, message = "So tre em khong duoc am")
    @Builder.Default
    private Integer children = 0;

    private Long categoryId;

    private BigDecimal minPrice;

    private BigDecimal maxPrice;

    private Integer durationMin;

    private Integer durationMax;

    private String difficulty;

    private BigDecimal minRating;

    @Builder.Default
    private String sort = "RECOMMENDED";
}
