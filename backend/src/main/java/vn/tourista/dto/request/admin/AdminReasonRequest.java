package vn.tourista.dto.request.admin;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminReasonRequest {

    @Size(max = 500, message = "Reason toi da 500 ky tu")
    private String reason;

    private Boolean isActive;
}