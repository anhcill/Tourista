package vn.tourista.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FavoriteUpsertRequest {

    @NotBlank(message = "targetType khong duoc de trong")
    private String targetType;

    @NotNull(message = "targetId khong duoc de trong")
    private Long targetId;
}
