package vn.tourista.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVnpayPaymentRequest {

    private Long bookingId;

    @NotBlank(message = "Mã booking là bắt buộc")
    @Size(max = 30, message = "Mã booking không hợp lệ")
    private String bookingCode;

    @Size(max = 300, message = "Return URL không hợp lệ")
    private String returnUrl;

    @Size(max = 20, message = "Mã ngân hàng không hợp lệ")
    private String bankCode;
}
