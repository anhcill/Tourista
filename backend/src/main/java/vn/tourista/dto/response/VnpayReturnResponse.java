package vn.tourista.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VnpayReturnResponse {

    private boolean validSignature;
    private boolean success;
    private String bookingCode;
    private String bookingStatus;
    private String responseCode;
    private String transactionStatus;
    private String transactionNo;
    private String amount;
    private String message;
}
