package vn.tourista.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.request.CreateArticleCommentRequest;
import vn.tourista.dto.request.CreateArticleRequest;
import vn.tourista.dto.request.UpdateArticleRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.ArticleCommentResponse;
import vn.tourista.dto.response.ArticleResponse;
import vn.tourista.service.ArticleService;

import java.util.List;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    @Autowired
    private ArticleService articleService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ArticleResponse>>> getArticles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int limit,
            @RequestParam(required = false) String category) {

        Page<ArticleResponse> data = articleService.getPublishedArticles(page, limit, category);
        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach bai viet thanh cong", data));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<ArticleResponse>>> getFeaturedArticles(
            @RequestParam(defaultValue = "6") int limit) {

        List<ArticleResponse> data = articleService.getFeaturedArticles(limit);
        return ResponseEntity.ok(ApiResponse.ok("Lay bai viet noi bat thanh cong", data));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<ArticleResponse>> getArticleBySlug(@PathVariable String slug) {
        ArticleResponse data = articleService.getArticleBySlug(slug);
        articleService.incrementViews(data.getId());
        return ResponseEntity.ok(ApiResponse.ok("Lay chi tiet bai viet thanh cong", data));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ArticleResponse>> createArticle(
            @Valid @RequestBody CreateArticleRequest request,
            Authentication authentication) {

        ArticleResponse data = articleService.createArticle(resolveEmail(authentication), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tao bai viet thanh cong", data));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ArticleResponse>> updateArticle(
            @PathVariable Long id,
            @Valid @RequestBody UpdateArticleRequest request,
            Authentication authentication) {

        ArticleResponse data = articleService.updateArticle(resolveEmail(authentication), id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat bai viet thanh cong", data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteArticle(
            @PathVariable Long id,
            Authentication authentication) {

        articleService.deleteArticle(resolveEmail(authentication), id);
        return ResponseEntity.ok(ApiResponse.ok("Xoa bai viet thanh cong"));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<Void>> toggleLike(
            @PathVariable Long id,
            Authentication authentication) {

        articleService.toggleLike(resolveEmail(authentication), id);
        return ResponseEntity.ok(ApiResponse.ok("Da thich bai viet"));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<Page<ArticleCommentResponse>>> getComments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {

        Page<ArticleCommentResponse> data = articleService.getArticleComments(id, page, limit);
        return ResponseEntity.ok(ApiResponse.ok("Lay binh luan thanh cong", data));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<ArticleCommentResponse>> createComment(
            @PathVariable Long id,
            @Valid @RequestBody CreateArticleCommentRequest request,
            Authentication authentication) {

        ArticleCommentResponse data = articleService.createComment(resolveEmail(authentication), id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tao binh luan thanh cong", data));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long commentId,
            Authentication authentication) {

        articleService.deleteComment(resolveEmail(authentication), commentId);
        return ResponseEntity.ok(ApiResponse.ok("Xoa binh luan thanh cong"));
    }

    private String resolveEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new IllegalArgumentException("Thong tin xac thuc khong hop le");
        }
        return authentication.getName().trim();
    }
}
