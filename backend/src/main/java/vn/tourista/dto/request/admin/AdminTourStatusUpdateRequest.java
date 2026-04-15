package vn.tourista.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminTourStatusUpdateRequest {

    @NotBlank(message = "Status khong duoc de trong")
    private String status;

    @NotBlank(message = "Reason khong duoc de trong")
    @Size(max = 500, message = "Reason toi da 500 ky tu")
    private String reason;
}