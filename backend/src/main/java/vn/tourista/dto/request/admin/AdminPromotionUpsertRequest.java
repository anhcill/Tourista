package vn.tourista.dto.request.admin;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class AdminPromotionUpsertRequest {

    @NotBlank(message = "Code khong duoc de trong")
    @Size(max = 30, message = "Code toi da 30 ky tu")
    private String code;

    @NotBlank(message = "Name khong duoc de trong")
    @Size(max = 150, message = "Name toi da 150 ky tu")
    private String name;

    @Size(max = 2000, message = "Description toi da 2000 ky tu")
    private String description;

    @NotBlank(message = "Type khong duoc de trong")
    private String type;

    @NotNull(message = "Value khong duoc de trong")
    @DecimalMin(value = "0.01", message = "Value phai lon hon 0")
    private BigDecimal value;

    @NotNull(message = "Min order amount khong duoc de trong")
    @DecimalMin(value = "0.00", message = "Min order amount khong hop le")
    private BigDecimal minOrderAmount;

    @DecimalMin(value = "0.00", message = "Max discount amount khong hop le")
    private BigDecimal maxDiscountAmount;

    @DecimalMin(value = "0", message = "Usage limit khong hop le")
    private Integer usageLimit;

    private String appliesTo;

    @NotNull(message = "StartAt khong duoc de trong")
    @JsonAlias({ "startDate", "validFrom" })
    private LocalDateTime startAt;

    @NotNull(message = "EndAt khong duoc de trong")
    @JsonAlias({ "endDate", "validTo" })
    private LocalDateTime endAt;

    private Boolean isActive;

    @NotBlank(message = "Reason khong duoc de trong")
    @Size(max = 500, message = "Reason toi da 500 ky tu")
    private String reason;
}