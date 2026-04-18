package vn.tourista.service;

import org.springframework.data.domain.Page;
import vn.tourista.dto.request.CreateArticleCommentRequest;
import vn.tourista.dto.request.CreateArticleRequest;
import vn.tourista.dto.request.UpdateArticleRequest;
import vn.tourista.dto.response.ArticleCommentResponse;
import vn.tourista.dto.response.ArticleResponse;

import java.util.List;

public interface ArticleService {

    Page<ArticleResponse> getPublishedArticles(int page, int limit, String category);

    List<ArticleResponse> getFeaturedArticles(int limit);

    ArticleResponse getArticleBySlug(String slug);

    ArticleResponse createArticle(String userEmail, CreateArticleRequest request);

    ArticleResponse updateArticle(String userEmail, Long articleId, UpdateArticleRequest request);

    void deleteArticle(String userEmail, Long articleId);

    void incrementViews(Long articleId);

    void toggleLike(String userEmail, Long articleId);

    Page<ArticleCommentResponse> getArticleComments(Long articleId, int page, int limit);

    ArticleCommentResponse createComment(String userEmail, Long articleId, CreateArticleCommentRequest request);

    void deleteComment(String userEmail, Long commentId);
}
