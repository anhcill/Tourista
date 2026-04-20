package vn.tourista.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CancelBookingRequest {

    @Size(max = 500, message = "Lý do hủy tối đa 500 ký tự")
    private String reason;
}
