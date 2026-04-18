package vn.tourista.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleResponse {

    private Long id;
    private String title;
    private String slug;
    private String excerpt;
    private String content;
    private String coverImageUrl;
    private String status;
    private String category;
    private Integer readTimeMinutes;
    private Long views;
    private Long likes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private AuthorInfo author;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthorInfo {
        private Long id;
        private String fullName;
        private String avatarUrl;
    }
}
