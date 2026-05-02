package vn.tourista.dto.request.admin;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminComboUpsertRequest {

    @NotBlank(message = "Name la bat buoc")
    @Size(max = 200, message = "Name toi da 200 ky tu")
    private String name;

    private String description;

    private String imageUrl;

    @NotBlank(message = "Combo type la bat buoc")
    private String comboType;

    private Long hotelId;

    private Long tourId;

    private Long secondHotelId;

    private Long secondTourId;

    @NotNull(message = "Valid from la bat buoc")
    private LocalDate validFrom;

    @NotNull(message = "Valid until la bat buoc")
    private LocalDate validUntil;

    @Min(value = 1, message = "Total slots toi thieu la 1")
    private Integer totalSlots;

    @Min(value = 0, message = "Remaining slots khong am")
    private Integer remainingSlots;

    @NotNull(message = "Original price la bat buoc")
    @DecimalMin(value = "0.01", message = "Original price phai lon hon 0")
    private BigDecimal originalPrice;

    @NotNull(message = "Combo price la bat buoc")
    @DecimalMin(value = "0.01", message = "Combo price phai lon hon 0")
    private BigDecimal comboPrice;

    @Min(value = 1, message = "Savings amount phai lon hon 0")
    private BigDecimal savingsAmount;

    @Min(value = 1, message = "Savings percent tu 1-100")
    @Max(value = 100, message = "Savings percent khong qua 100")
    private Integer savingsPercent;

    private Boolean isFeatured;

    private Boolean isActive;

    @Size(max = 500, message = "Reason toi da 500 ky tu")
    private String reason;
}
