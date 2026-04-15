package vn.tourista.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {

    @NotBlank(message = "Token khong duoc de trong")
    private String token;

    @NotBlank(message = "Mat khau moi khong duoc de trong")
    @Size(min = 8, message = "Mat khau moi phai co it nhat 8 ky tu")
    private String newPassword;
}