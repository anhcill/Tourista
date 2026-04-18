package vn.tourista.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateArticleCommentRequest {

    @NotBlank(message = "Noi dung binh luan la bat buoc")
    @Size(max = 1000, message = "Noi dung binh luan khong qua 1000 ky tu")
    private String content;
}
