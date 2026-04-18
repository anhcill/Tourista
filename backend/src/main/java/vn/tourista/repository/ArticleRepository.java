package vn.tourista.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.tourista.entity.Article;

import java.util.Optional;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {

    Optional<Article> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Article> findByStatus(Article.ArticleStatus status, Pageable pageable);

    Page<Article> findByStatusAndCategory(Article.ArticleStatus status, String category, Pageable pageable);

    Page<Article> findByAuthorId(Long authorId, Pageable pageable);

    @Query("""
            SELECT a FROM Article a
            WHERE a.status = 'PUBLISHED'
              AND (LOWER(a.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(a.excerpt) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(a.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY a.createdAt DESC
            """)
    Page<Article> searchPublishedArticles(@Param("keyword") String keyword, Pageable pageable);

    @Modifying
    @Query("UPDATE Article a SET a.views = a.views + 1 WHERE a.id = :id")
    void incrementViews(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Article a SET a.likes = a.likes + 1 WHERE a.id = :id")
    void incrementLikes(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Article a SET a.likes = a.likes - 1 WHERE a.id = :id AND a.likes > 0")
    void decrementLikes(@Param("id") Long id);
}
