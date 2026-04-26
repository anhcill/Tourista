package vn.tourista.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class HotelSearchRequest {

    @NotBlank(message = "City là bắt buộc")
    private String city;

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

    @NotNull(message = "Số phòng là bắt buộc")
    @Min(value = 1, message = "Số phòng phải lớn hơn hoặc bằng 1")
    @Builder.Default
    private Integer rooms = 1;

    @Builder.Default
    private Integer page = 0;

    @Builder.Default
    private Integer pageSize = 8;
}
