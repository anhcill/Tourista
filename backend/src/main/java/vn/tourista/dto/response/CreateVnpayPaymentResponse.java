package vn.tourista.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVnpayPaymentResponse {

    private String bookingCode;
    private String paymentUrl;
    private String provider;
    private LocalDateTime expiresAt;
}
