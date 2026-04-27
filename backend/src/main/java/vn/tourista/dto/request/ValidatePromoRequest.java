package vn.tourista.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidatePromoRequest {

    @NotBlank(message = "Mã khuyến mãi là bắt buộc")
    private String code;

    @NotNull(message = "Loại áp dụng là bắt buộc")
    private String appliesTo;

    @NotNull(message = "Số tiền đơn hàng là bắt buộc")
    private BigDecimal orderAmount;
}
