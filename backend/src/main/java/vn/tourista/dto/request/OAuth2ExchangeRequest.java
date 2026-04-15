package vn.tourista.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OAuth2ExchangeRequest {

    @NotBlank(message = "OAuth2 code la bat buoc")
    private String code;
}
