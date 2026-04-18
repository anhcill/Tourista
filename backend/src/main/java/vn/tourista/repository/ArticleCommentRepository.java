package vn.tourista.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.tourista.entity.ArticleComment;

@Repository
public interface ArticleCommentRepository extends JpaRepository<ArticleComment, Long> {

    Page<ArticleComment> findByArticleIdOrderByCreatedAtDesc(Long articleId, Pageable pageable);

    long countByArticleId(Long articleId);

    void deleteByArticleId(Long articleId);
}
