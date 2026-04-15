package vn.tourista.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserProfileUpdateRequest {

    @NotBlank(message = "Ho ten khong duoc de trong")
    @Size(min = 2, max = 100, message = "Ho ten phai tu 2 den 100 ky tu")
    private String fullName;

    @Pattern(regexp = "^(\\+84|0)[3-9]\\d{8}$", message = "So dien thoai khong hop le")
    private String phone;

    @Size(max = 500, message = "Avatar URL khong duoc vuot qua 500 ky tu")
    private String avatarUrl;
}
