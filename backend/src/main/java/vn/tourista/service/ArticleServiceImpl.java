package vn.tourista.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.tourista.dto.request.CreateArticleCommentRequest;
import vn.tourista.dto.request.CreateArticleRequest;
import vn.tourista.dto.request.UpdateArticleRequest;
import vn.tourista.dto.response.ArticleCommentResponse;
import vn.tourista.dto.response.ArticleResponse;
import vn.tourista.entity.Article;
import vn.tourista.entity.ArticleComment;
import vn.tourista.entity.User;
import vn.tourista.exception.ResourceNotFoundException;
import vn.tourista.exception.UnauthorizedException;
import vn.tourista.repository.ArticleCommentRepository;
import vn.tourista.repository.ArticleRepository;
import vn.tourista.repository.UserRepository;
import vn.tourista.util.SlugUtil;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArticleServiceImpl implements ArticleService {

    private final ArticleRepository articleRepository;
    private final ArticleCommentRepository articleCommentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ArticleResponse> getPublishedArticles(int page, int limit, String category) {
        PageRequest pageRequest = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Article> articles;

        if (category != null && !category.isBlank()) {
            articles = articleRepository.findByStatusAndCategory(Article.ArticleStatus.PUBLISHED, category, pageRequest);
        } else {
            articles = articleRepository.findByStatus(Article.ArticleStatus.PUBLISHED, pageRequest);
        }

        return articles.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ArticleResponse> getFeaturedArticles(int limit) {
        PageRequest pageRequest = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "views"));
        Page<Article> articles = articleRepository.findByStatus(Article.ArticleStatus.PUBLISHED, pageRequest);
        return articles.getContent().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ArticleResponse getArticleBySlug(String slug) {
        Article article = articleRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay bai viet voi slug: " + slug));
        return toResponse(article);
    }

    @Override
    @Transactional
    public ArticleResponse createArticle(String userEmail, CreateArticleRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("Khong tim thay nguoi dung"));

        String slug = SlugUtil.toSlug(request.getTitle());
        int suffix = 1;
        String originalSlug = slug;
        while (articleRepository.existsBySlug(slug)) {
            slug = originalSlug + "-" + suffix++;
        }

        Article article = Article.builder()
                .authorId(user.getId())
                .title(request.getTitle())
                .slug(slug)
                .excerpt(request.getExcerpt())
                .content(request.getContent())
                .coverImageUrl(request.getCoverImageUrl())
                .category(request.getCategory())
                .status(parseStatus(request.getStatus()))
                .build();

        if (article.getStatus() == null) {
            article.setStatus(Article.ArticleStatus.DRAFT);
        }

        int wordCount = request.getContent() != null ? request.getContent().split("\\s+").length : 0;
        article.setReadTimeMinutes(Math.max(1, wordCount / 200 + 1));

        Article saved = articleRepository.save(article);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ArticleResponse updateArticle(String userEmail, Long articleId, UpdateArticleRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("Khong tim thay nguoi dung"));

        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay bai viet"));

        if (!article.getAuthorId().equals(user.getId()) && !isAdmin(user)) {
            throw new UnauthorizedException("Ban khong co quyen chinh sua bai viet nay");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            article.setTitle(request.getTitle());
            String newSlug = SlugUtil.toSlug(request.getTitle());
            if (!newSlug.equals(article.getSlug())) {
                int suffix = 1;
                String originalSlug = newSlug;
                while (articleRepository.existsBySlug(newSlug)) {
                    newSlug = originalSlug + "-" + suffix++;
                }
                article.setSlug(newSlug);
            }
        }
        if (request.getExcerpt() != null) article.setExcerpt(request.getExcerpt());
        if (request.getContent() != null) {
            article.setContent(request.getContent());
            int wordCount = request.getContent().split("\\s+").length;
            article.setReadTimeMinutes(Math.max(1, wordCount / 200 + 1));
        }
        if (request.getCoverImageUrl() != null) article.setCoverImageUrl(request.getCoverImageUrl());
        if (request.getCategory() != null) article.setCategory(request.getCategory());
        if (request.getStatus() != null) article.setStatus(parseStatus(request.getStatus()));

        Article saved = articleRepository.save(article);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteArticle(String userEmail, Long articleId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("Khong tim thay nguoi dung"));

        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay bai viet"));

        if (!article.getAuthorId().equals(user.getId()) && !isAdmin(user)) {
            throw new UnauthorizedException("Ban khong co quyen xoa bai viet nay");
        }

        articleCommentRepository.deleteByArticleId(articleId);
        articleRepository.delete(article);
    }

    @Override
    @Transactional
    public void incrementViews(Long articleId) {
        articleRepository.incrementViews(articleId);
    }

    @Override
    @Transactional
    public void toggleLike(String userEmail, Long articleId) {
        articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay bai viet"));
        articleRepository.incrementLikes(articleId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ArticleCommentResponse> getArticleComments(Long articleId, int page, int limit) {
        PageRequest pageRequest = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ArticleComment> comments = articleCommentRepository.findByArticleIdOrderByCreatedAtDesc(articleId, pageRequest);
        return comments.map(this::toCommentResponse);
    }

    @Override
    @Transactional
    public ArticleCommentResponse createComment(String userEmail, Long articleId, CreateArticleCommentRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("Khong tim thay nguoi dung"));

        articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay bai viet"));

        ArticleComment comment = ArticleComment.builder()
                .articleId(articleId)
                .userId(user.getId())
                .content(request.getContent())
                .build();

        ArticleComment saved = articleCommentRepository.save(comment);
        return toCommentResponse(saved);
    }

    @Override
    @Transactional
    public void deleteComment(String userEmail, Long commentId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("Khong tim thay nguoi dung"));

        ArticleComment comment = articleCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay binh luan"));

        if (!comment.getUserId().equals(user.getId()) && !isAdmin(user)) {
            throw new UnauthorizedException("Ban khong co quyen xoa binh luan nay");
        }

        articleCommentRepository.delete(comment);
    }

    private ArticleResponse toResponse(Article article) {
        ArticleResponse.AuthorInfo authorInfo = ArticleResponse.AuthorInfo.builder()
                .id(article.getAuthorId())
                .fullName("Unknown")
                .build();

        if (article.getAuthorId() != null) {
            authorInfo = userRepository.findById(article.getAuthorId()).map(user ->
                    ArticleResponse.AuthorInfo.builder()
                            .id(user.getId())
                            .fullName(user.getFullName())
                            .avatarUrl(user.getAvatarUrl())
                            .build()
            ).orElse(authorInfo);
        }

        return ArticleResponse.builder()
                .id(article.getId())
                .title(article.getTitle())
                .slug(article.getSlug())
                .excerpt(article.getExcerpt())
                .content(article.getContent())
                .coverImageUrl(article.getCoverImageUrl())
                .status(article.getStatus() != null ? article.getStatus().name() : null)
                .category(article.getCategory())
                .readTimeMinutes(article.getReadTimeMinutes())
                .views(article.getViews())
                .likes(article.getLikes())
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .author(authorInfo)
                .build();
    }

    private ArticleCommentResponse toCommentResponse(ArticleComment comment) {
        ArticleCommentResponse.AuthorInfo authorInfo = ArticleCommentResponse.AuthorInfo.builder()
                .id(comment.getUserId())
                .fullName("Unknown")
                .build();

        if (comment.getUserId() != null) {
            authorInfo = userRepository.findById(comment.getUserId()).map(user ->
                    ArticleCommentResponse.AuthorInfo.builder()
                            .id(user.getId())
                            .fullName(user.getFullName())
                            .avatarUrl(user.getAvatarUrl())
                            .build()
            ).orElse(authorInfo);
        }

        return ArticleCommentResponse.builder()
                .id(comment.getId())
                .articleId(comment.getArticleId())
                .userId(comment.getUserId())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .author(authorInfo)
                .build();
    }

    private Article.ArticleStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return Article.ArticleStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Article.ArticleStatus.DRAFT;
        }
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && "ADMIN".equals(user.getRole().getName());
    }
}
