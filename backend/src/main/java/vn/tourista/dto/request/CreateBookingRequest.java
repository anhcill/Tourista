package vn.tourista.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookingRequest {

    @NotNull(message = "Hotel ID là bắt buộc")
    private Long hotelId;

    @NotNull(message = "Room type ID là bắt buộc")
    private Long roomTypeId;

    @NotNull(message = "Ngày nhận phòng là bắt buộc")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate checkIn;

    @NotNull(message = "Ngày trả phòng là bắt buộc")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate checkOut;

    @NotNull(message = "Số người lớn là bắt buộc")
    @Min(value = 1, message = "Số người lớn phải lớn hơn hoặc bằng 1")
    @Builder.Default
    private Integer adults = 2;

    @NotNull(message = "Số trẻ em là bắt buộc")
    @Min(value = 0, message = "Số trẻ em không thể âm")
    @Builder.Default
    private Integer children = 0;

    @NotNull(message = "Số phòng là bắt buộc")
    @Min(value = 1, message = "Số phòng phải lớn hơn hoặc bằng 1")
    @Builder.Default
    private Integer rooms = 1;

    @Size(max = 100, message = "Tên khách không quá 100 ký tự")
    private String guestName;

    @Size(max = 150, message = "Email khách không quá 150 ký tự")
    private String guestEmail;

    @Size(max = 20, message = "Số điện thoại không quá 20 ký tự")
    private String guestPhone;

    @Size(max = 1000, message = "Yêu cầu đặc biệt không quá 1000 ký tự")
    private String specialRequests;
}
