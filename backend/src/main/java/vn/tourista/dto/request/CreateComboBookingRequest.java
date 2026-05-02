package vn.tourista.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateComboBookingRequest {

    @NotNull(message = "Combo ID la bat buoc")
    private Long comboId;

    @NotBlank(message = "Ten khach hang la bat buoc")
    private String guestName;

    @NotBlank(message = "Email la bat buoc")
    @Email(message = "Email khong hop le")
    private String guestEmail;

    private String guestPhone;

    @NotNull(message = "Ngay dat la bat buoc")
    private LocalDate bookingDate;

    @Min(value = 1, message = "So khach toi thieu la 1")
    @Builder.Default
    private Integer guestCount = 1;

    @Min(value = 1, message = "So dem toi thieu la 1")
    @Builder.Default
    private Integer nights = 1;

    private String note;

    @NotBlank(message = "Phuong thuc thanh toan la bat buoc")
    private String paymentMethod; // VNPAY | MOMO | ZALOPAY | COD
}
