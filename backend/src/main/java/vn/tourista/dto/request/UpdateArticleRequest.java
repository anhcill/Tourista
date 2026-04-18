package vn.tourista.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateArticleRequest {

    @Size(max = 250, message = "Tieu de khong qua 250 ky tu")
    private String title;

    @Size(max = 500, message = "Mo ta ngan khong qua 500 ky tu")
    private String excerpt;

    private String content;

    private String coverImageUrl;

    @Size(max = 100, message = "Danh muc khong qua 100 ky tu")
    private String category;

    private String status;
}
