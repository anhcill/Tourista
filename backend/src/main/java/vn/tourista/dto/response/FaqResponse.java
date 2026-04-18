package vn.tourista.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FaqResponse {

    private String id;
    private String question;
    private String answer;
    private String category;

    public record FaqListResponse(
            java.util.List<FaqResponse> faqs,
            String source
    ) {}
}
