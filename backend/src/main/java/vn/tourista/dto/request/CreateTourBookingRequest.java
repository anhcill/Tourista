package vn.tourista.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTourBookingRequest {

    @NotNull(message = "Tour ID la bat buoc")
    private Long tourId;

    @NotNull(message = "Departure ID la bat buoc")
    private Long departureId;

    @NotNull(message = "So nguoi lon la bat buoc")
    @Min(value = 1, message = "So nguoi lon phai lon hon hoac bang 1")
    @Builder.Default
    private Integer adults = 1;

    @NotNull(message = "So tre em la bat buoc")
    @Min(value = 0, message = "So tre em khong duoc am")
    @Builder.Default
    private Integer children = 0;

    @Size(max = 100, message = "Ten khach khong qua 100 ky tu")
    private String guestName;

    @Size(max = 150, message = "Email khach khong qua 150 ky tu")
    private String guestEmail;

    @Size(max = 20, message = "So dien thoai khong qua 20 ky tu")
    private String guestPhone;

    @Size(max = 1000, message = "Yeu cau dac biet khong qua 1000 ky tu")
    private String specialRequests;
}
